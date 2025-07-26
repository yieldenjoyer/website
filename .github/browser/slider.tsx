import { useEffect, useRef } from 'react';
import gsap from 'gsap';

interface CryptoItem {
  id: string;
  title: string;
  price: string;
  desc: string;
}

interface SliderProps {
  items: CryptoItem[];
}

const Slider: React.FC<SliderProps> = ({ items }) => {
  const sliderRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLSpanElement>(null);
  let currentIndex = 0;
  let isDragging = false;
  let startX = 0;
  let currentTranslate = 0;
  let prevTranslate = 0;

  useEffect(() => {
    const slider = sliderRef.current;
    if (!slider) return;

    const slides = slider.querySelectorAll('.slide');
    const slideWidth = slides[0].getBoundingClientRect().width;

    const setSliderPosition = () => {
      gsap.to(slider, {
        x: currentTranslate,
        duration: 0.5,
        ease: 'power2.out',
      });
    };

    const updateProgress = () => {
      if (progressRef.current) {
        progressRef.current.textContent = (currentIndex / (items.length - 1)).toFixed(3);
      }
    };

    const goToSlide = (index: number) => {
      currentIndex = Math.max(0, Math.min(index, items.length - 1));
      currentTranslate = -currentIndex * slideWidth;
      prevTranslate = currentTranslate;
      setSliderPosition();
      updateProgress();
    };

    const handleDragStart = (clientX: number) => {
      isDragging = true;
      startX = clientX;
      gsap.killTweensOf(slider);
    };

    const handleDragMove = (clientX: number) => {
      if (!isDragging) return;
      const deltaX = clientX - startX;
      currentTranslate = prevTranslate + deltaX;
      setSliderPosition();
    };

    const handleDragEnd = () => {
      isDragging = false;
      const movedBy = currentTranslate - prevTranslate;
      if (movedBy < -100 && currentIndex < items.length - 1) {
        goToSlide(currentIndex + 1);
      } else if (movedBy > 100 && currentIndex > 0) {
        goToSlide(currentIndex - 1);
      } else {
        goToSlide(currentIndex);
      }
    };

    const handleMouseDown = (e: MouseEvent) => handleDragStart(e.clientX);
    const handleMouseMove = (e: MouseEvent) => handleDragMove(e.clientX);
    const handleMouseUp = () => handleDragEnd();
    const handleTouchStart = (e: TouchEvent) => handleDragStart(e.touches[0].clientX);
    const handleTouchMove = (e: TouchEvent) => handleDragMove(e.touches[0].clientX);
    const handleTouchEnd = () => handleDragEnd();

    slider.addEventListener('mousedown', handleMouseDown);
    slider.addEventListener('mousemove', handleMouseMove);
    slider.addEventListener('mouseup', handleMouseUp);
    slider.addEventListener('mouseleave', handleMouseUp);
    slider.addEventListener('touchstart', handleTouchStart);
    slider.addEventListener('touchmove', handleTouchMove);
    slider.addEventListener('touchend', handleTouchEnd);

    return () => {
      slider.removeEventListener('mousedown', handleMouseDown);
      slider.removeEventListener('mousemove', handleMouseMove);
      slider.removeEventListener('mouseup', handleMouseUp);
      slider.removeEventListener('mouseleave', handleMouseUp);
      slider.removeEventListener('touchstart', handleTouchStart);
      slider.removeEventListener('touchmove', handleTouchMove);
      slider.removeEventListener('touchend', handleTouchEnd);
    };
  }, [items]);

  return (
    <div className="relative overflow-hidden py-12">
      <div ref={sliderRef} className="flex transition-transform">
        {items.map((item) => (
          <div key={item.id} className="slide flex-shrink-0 w-full md:w-1/3 p-4">
            <div className="card">
              <h3 className="text-xl font-bold">{item.title}</h3>