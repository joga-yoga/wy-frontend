export const scrollTo = (id: string, offset = 124) => {
  if (typeof window === "undefined" || typeof document === "undefined") {
    return;
  }
  const element = document.getElementById(id);

  if (element) {
    const elementPosition = element.getBoundingClientRect().top;
    const offsetPosition = elementPosition + window.scrollY - offset;

    window.scrollTo({
      top: offsetPosition,
      behavior: "smooth",
    });
  }
};
