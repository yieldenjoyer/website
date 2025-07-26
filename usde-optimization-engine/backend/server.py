from flask import Flask, request, jsonify
from flask_cors import CORS
import numpy as np
from scipy.optimize import minimize
import requests
import json
from datetime import datetime, timedelta
import random

app = Flask(__name__)
CORS(app)  # Enable CORS for React frontend

class YieldOptimizer:
    def __init__(self):
        self.protocols = {
            'Strata Finance': {'base_apy': 12.5, 'risk_factor': 0.15, 'tvl_capacity': 1000000},
            'Terminal Finance': {'base_apy': 15.8, 'risk_factor': 0.25, 'tvl_capacity': 800000},
            'Ethereal Finance': {'base_apy': 18.2, 'risk_factor': 0.35, 'tvl_capacity': 600000},
            'USDe Staking': {'base_apy': 8.5, 'risk_factor': 0.05, 'tvl_capacity': 2000000}
        }
    
    def calculate_sharpe_ratio(self, weights, returns, cov_matrix, risk_free_rate=0.03):
        """Calculate Sharpe ratio for portfolio optimization"""
        portfolio_return = np.sum(returns * weights)
        portfolio_volatility = np.sqrt(np.dot(weights.T, np.dot(cov_matrix, weights)))
        return (portfolio_return - risk_free_rate) / portfolio_volatility
    
    def optimize_portfolio(self, vault_type='Balanced'):
        """Optimize portfolio allocation using Modern Portfolio Theory"""
        protocols = list(self.protocols.keys())
        n_assets = len(protocols)
        
        # Generate mock returns and covariance matrix
        base_returns = np.array([self.protocols[p]['base_apy']/100 for p in protocols])
        
        # Add some randomness to simulate market conditions
        current_returns = base_returns + np.random.normal(0, 0.02, n_assets)
        
        # Create covariance matrix based on risk factors
        risk_factors = np.array([self.protocols[p]['risk_factor'] for p in protocols])
        cov_matrix = np.outer(risk_factors, risk_factors) * 0.5
        np.fill_diagonal(cov_matrix, risk_factors ** 2)
        
        # Define constraints based on vault type
        if vault_type == 'Conservative':
            risk_tolerance = 0.1
            max_single_allocation = 0.4
        elif vault_type == 'Balanced':
            risk_tolerance = 0.2
            max_single_allocation = 0.6
        else:  # Aggressive
            risk_tolerance = 0.4
            max_single_allocation = 0.8
        
        # Objective function (negative Sharpe ratio for minimization)
        def objective(weights):
            return -self.calculate_sharpe_ratio(weights, current_returns, cov_matrix)
        
        # Constraints
        constraints = [
            {'type': 'eq', 'fun': lambda x: np.sum(x) - 1},  # Sum to 1
        ]
        
        # Bounds
        bounds = [(0.05, max_single_allocation) for _ in range(n_assets)]
        
        # Initial guess (equal weights)
        x0 = np.array([1/n_assets] * n_assets)
        
        # Optimize
        result = minimize(objective, x0, method='SLSQP', bounds=bounds, constraints=constraints)
        
        if result.success:
            optimal_weights = result.x
        else:
            # Fallback to equal weights if optimization fails
            optimal_weights = np.array([1/n_assets] * n_assets)
        
        # Calculate expected APY
        portfolio_apy = np.sum(optimal_weights * current_returns * 100)
        
        # Format allocation data
        allocations = []
        for i, protocol in enumerate(protocols):
            allocations.append({
                'name': protocol,
                'value': optimal_weights[i] * 100,
                'apy': current_returns[i] * 100
            })
        
        return {
            'apy': f'{portfolio_apy:.2f}%',
            'allocations': allocations,
            'sharpe_ratio': -result.fun if result.success else 1.5
        }
    
    def generate_historical_data(self, days=30):
        """Generate mock historical performance data"""
        historical = []
        base_date = datetime.now() - timedelta(days=days)
        
        for i in range(days):
            date = base_date + timedelta(days=i)
            # Simulate APY fluctuation
            apy = 15.5 + np.sin(i * 0.2) * 3 + random.uniform(-1, 1)
            # Simulate TVL growth
            tvl = 1500000 + i * 50000 + random.uniform(-100000, 100000)
            
            historical.append({
                'date': date.strftime('%Y-%m-%d'),
                'apy': round(apy, 2),
                'tvl': int(tvl)
            })
        
        return historical

# Initialize optimizer
optimizer = YieldOptimizer()

@app.route('/api/optimize', methods=['GET'])
def optimize():
    """Main optimization endpoint"""
    try:
        vault_type = request.args.get('type', 'Balanced')
        
        # Get optimized portfolio
        result = optimizer.optimize_portfolio(vault_type)
        
        # Add historical data
        result['historical'] = optimizer.generate_historical_data()
        
        return jsonify(result)
    
    except Exception as e:
        return jsonify({
            'error': str(e),
            'apy': 'Error',
            'allocations': [],
            'historical': []
        }), 500

@app.route('/api/protocols', methods=['GET'])
def get_protocols():
    """Get available protocols and their info"""
    try:
        protocols_info = []
        for name, info in optimizer.protocols.items():
            protocols_info.append({
                'name': name,
                'base_apy': info['base_apy'],
                'risk_factor': info['risk_factor'],
                'tvl_capacity': info['tvl_capacity']
            })
        
        return jsonify({'protocols': protocols_info})
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/rebalance', methods=['POST'])
def rebalance():
    """Endpoint for rebalancing portfolio"""
    try:
        data = request.get_json()
        vault_type = data.get('vault_type', 'Balanced')
        current_allocations = data.get('current_allocations', [])
        
        # Get new optimal allocation
        new_result = optimizer.optimize_portfolio(vault_type)
        
        # Calculate rebalancing trades needed
        trades = []
        for i, allocation in enumerate(new_result['allocations']):
            current_weight = 0
            if i < len(current_allocations):
                current_weight = current_allocations[i].get('value', 0)
            
            weight_diff = allocation['value'] - current_weight
            if abs(weight_diff) > 1:  # Only trade if difference > 1%
                trades.append({
                    'protocol': allocation['name'],
                    'action': 'increase' if weight_diff > 0 else 'decrease',
                    'amount_percent': abs(weight_diff)
                })
        
        return jsonify({
            'new_allocations': new_result['allocations'],
            'trades_needed': trades,
            'expected_apy': new_result['apy']
        })
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/risk-metrics', methods=['GET'])
def get_risk_metrics():
    """Get risk metrics for the portfolio"""
    try:
        vault_type = request.args.get('type', 'Balanced')
        
        # Calculate risk metrics
        protocols = list(optimizer.protocols.keys())
        risk_factors = [optimizer.protocols[p]['risk_factor'] for p in protocols]
        
        avg_risk = np.mean(risk_factors)
        max_risk = max(risk_factors)
        min_risk = min(risk_factors)
        
        # Risk score based on vault type
        if vault_type == 'Conservative':
            risk_score = 3.2
        elif vault_type == 'Balanced':
            risk_score = 5.8
        else:  # Aggressive
            risk_score = 8.1
        
        return jsonify({
            'risk_score': risk_score,
            'avg_protocol_risk': avg_risk,
            'max_protocol_risk': max_risk,  
            'min_protocol_risk': min_risk,
            'volatility_estimate': f'{avg_risk * 100:.1f}%'
        })
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'timestamp': datetime.now().isoformat(),
        'protocols_available': len(optimizer.protocols)
    })

if __name__ == '__main__':
    print("🚀 USDe Yield Optimization Engine Backend Starting...")
    print("📊 Available protocols:", list(optimizer.protocols.keys()))
    print("🌐 Server running on http://localhost:5000")
    
    app.run(debug=True, host='0.0.0.0', port=5000)
