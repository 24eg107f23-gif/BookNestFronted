import React from "react";
import { Link, useParams } from "react-router-dom";

function BookDetails() {
  const { id } = useParams();

  const books = [
    {
      id: 1,
      title: "The Alchemist",
      author: "Paulo Coelho",
      category: "Fiction",
      description:
        "A story about following your dreams and discovering your own path in life.",
    },
    {
      id: 2,
      title: "Atomic Habits",
      author: "James Clear",
      category: "Self Help",
      description:
        "A practical guide to building good habits and breaking bad ones.",
    },
    {
      id: 3,
      title: "The Psychology of Money",
      author: "Morgan Housel",
      category: "Finance",
      description:
        "A collection of lessons about money, investing, behavior, and financial decisions.",
    },
    {
      id: 4,
      title: "Rich Dad Poor Dad",
      author: "Robert Kiyosaki",
      category: "Finance",
      description:
        "A book about financial education, money management, and building wealth.",
    },
  ];

  const book = books.find((item) => item.id === Number(id));

  if (!book) {
    return (
      <div className="book-details">
        <h1>Book Not Found</h1>
        <Link to="/books">← Back to Books</Link>
      </div>
    );
  }

  return (
    <div className="book-details">
      <div className="book-details-card">
        <div className="book-details-cover">📚</div>

        <div className="book-details-info">
          <span className="category">{book.category}</span>

          <h1>{book.title}</h1>

          <h3>By {book.author}</h3>

          <p>{book.description}</p>

          <div className="book-actions">
            <button onClick={() => alert("Book borrowed successfully!")}>
  Borrow Book
</button>
            <Link to="/books">← Back to Books</Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default BookDetails;