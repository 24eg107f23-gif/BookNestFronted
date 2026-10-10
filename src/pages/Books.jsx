import React, { useState } from "react";
import { Link } from "react-router-dom";

function Books() {
  const [search, setSearch] = useState("");

  const books = [
    {
      id: 1,
      title: "The Alchemist",
      author: "Paulo Coelho",
      category: "Fiction",
    },
    {
      id: 2,
      title: "Atomic Habits",
      author: "James Clear",
      category: "Self Help",
    },
    {
      id: 3,
      title: "The Psychology of Money",
      author: "Morgan Housel",
      category: "Finance",
    },
    {
      id: 4,
      title: "Rich Dad Poor Dad",
      author: "Robert Kiyosaki",
      category: "Finance",
    },
  ];

  const filteredBooks = books.filter(
    (book) =>
      book.title.toLowerCase().includes(search.toLowerCase()) ||
      book.author.toLowerCase().includes(search.toLowerCase()) ||
      book.category.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="books-page">
      <div className="books-header">
        <h1>Explore Books</h1>
        <p>Discover your next great read.</p>

        <input
          type="text"
          placeholder="🔍 Search books, authors, categories..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="books-grid">
        {filteredBooks.map((book) => (
          <div className="book-card" key={book.id}>
            <div className="book-cover">📚</div>

            <div className="book-info">
              <h2>{book.title}</h2>
              <p className="author">By {book.author}</p>
              <span className="category">{book.category}</span>

              <Link to={`/books/${book.id}`} className="details-button">
  View Details
</Link>
            </div>
          </div>
        ))}
      </div>

      {filteredBooks.length === 0 && (
        <p className="no-books">No books found.</p>
      )}
    </div>
  );
}

export default Books;