const BOOKMARKS_STORAGE_KEY = "bookmarkedEvents";

export const getBookmarkedEvents = (): string[] => {
  if (typeof window !== "undefined") {
    const storedBookmarks = localStorage.getItem(BOOKMARKS_STORAGE_KEY);
    const parsedBookmarks = storedBookmarks ? JSON.parse(storedBookmarks) : [];
    const filteredBookmarks = parsedBookmarks.filter((bookmark: string) => bookmark !== null);
    return filteredBookmarks;
  }
  return [];
};

export const addBookmark = (eventId: string): void => {
  if (typeof window !== "undefined") {
    const bookmarks = getBookmarkedEvents();
    if (!bookmarks.includes(eventId)) {
      bookmarks.push(eventId);
      localStorage.setItem(BOOKMARKS_STORAGE_KEY, JSON.stringify(bookmarks));
    }
  }
};

export const removeBookmark = (eventId: string): void => {
  if (typeof window !== "undefined") {
    let bookmarks = getBookmarkedEvents();
    bookmarks = bookmarks.filter((id) => id !== eventId);
    localStorage.setItem(BOOKMARKS_STORAGE_KEY, JSON.stringify(bookmarks));
  }
};

export const isEventBookmarked = (eventId: string): boolean => {
  if (typeof window !== "undefined") {
    const bookmarks = getBookmarkedEvents();
    return bookmarks.includes(eventId);
  }
  return false;
};
