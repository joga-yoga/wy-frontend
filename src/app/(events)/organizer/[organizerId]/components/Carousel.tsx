"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import * as React from "react";

interface CarouselProps<T> {
  title?: string;
  items: T[];
  renderItem: (item: T, index: number, image?: string) => React.ReactNode;
  className?: string;
  image?: string;
}

export const Carousel = <T,>({ title, items, renderItem, className, image }: CarouselProps<T>) => {
  const scrollRef = React.useRef<HTMLDivElement | null>(null);
  const [canScrollLeft, setCanScrollLeft] = React.useState(false);
  const [canScrollRight, setCanScrollRight] = React.useState(true);

  const updateButtons = () => {
    if (!scrollRef.current) return;
    const { scrollLeft, clientWidth, scrollWidth } = scrollRef.current;

    setCanScrollLeft(scrollLeft > 0);
    setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 1);
  };

  const scroll = (dir: "left" | "right") => {
    if (!scrollRef.current) return;
    const { scrollLeft, clientWidth } = scrollRef.current;
    const amount = clientWidth * 0.8;

    scrollRef.current.scrollTo({
      left: dir === "left" ? scrollLeft - amount : scrollLeft + amount,
      behavior: "smooth",
    });
  };

  React.useEffect(() => {
    updateButtons();
    const el = scrollRef.current;
    if (!el) return;

    el.addEventListener("scroll", updateButtons);
    window.addEventListener("resize", updateButtons);

    return () => {
      el.removeEventListener("scroll", updateButtons);
      window.removeEventListener("resize", updateButtons);
    };
  }, []);

  // Показываем кнопки только если элементов больше 2
  const showControls = items.length > 2;

  return (
    <div className={`w-full ${className || ""}`}>
      {/* Заголовок + кнопки */}
      {title && (
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-listing-description md:text-h-middle text-gray-800">{title}</h2>
          {showControls && (
            <div className="flex gap-2">
              <button
                onClick={() => scroll("left")}
                disabled={!canScrollLeft}
                className="rounded-full bg-white shadow p-2 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={() => scroll("right")}
                disabled={!canScrollRight}
                className="rounded-full bg-white shadow p-2 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Горизонтальный скролл */}
      <div
        ref={scrollRef}
        className="
          flex flex-row flex-nowrap
          overflow-x-auto scroll-smooth
          [&::-webkit-scrollbar]:hidden
          [-ms-overflow-style:'none'] [scrollbar-width:'none']
          gap-[29px]
        "
      >
        {items.map((item, index) => (
          <div
            key={index}
            className="
              flex-shrink-0
              w-[100%]                 /* мобилка: 1 карточка */
              sm:w-[calc((100%/1.5)-29px)] /* планшет: 1.5 карточки */
              md:w-[calc((100%/2.5)-29px)] /* десктоп: 2.5 карточки */
            "
          >
            {renderItem(item, index, image)}
          </div>
        ))}
      </div>
    </div>
  );
};
