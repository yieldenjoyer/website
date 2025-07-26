import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import YieldEngine from './components/YieldEngine';

const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<YieldEngine />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
