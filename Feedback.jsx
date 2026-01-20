import React, { useState } from "react";
import "./Feedback.css";

export default function Feedback() {
  const [rating, setRating] = useState(null);

  const submit = (e) => {
    e.preventDefault();
    alert("Feedback received. Nothing stored. Everything felt.");
  };

  return (
    <section className="feedback">
      <h2>Your Feedback</h2>
      <p>Be honest. We can take it.</p>

      <form onSubmit={submit}>
        <div className="rating">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              type="button"
              key={n}
              className={rating === n ? "active" : ""}
              onClick={() => setRating(n)}
              aria-label={`Rate ${n}`}
            >
              ★
            </button>
          ))}
        </div>

        <textarea
          placeholder="What worked? What didn’t?"
          rows="4"
          required
        />

        <button type="submit" disabled={!rating}>
          Send Feedback
        </button>
      </form>
    </section>
  );
}
