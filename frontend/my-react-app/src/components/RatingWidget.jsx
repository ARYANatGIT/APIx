import React from 'react';

export default function RatingWidget({ rating = "4.9", reviewCount = "2,400+" }) {
  return (
    <div className="rating-widget-container">
      <div className="rating-score-row">
        <span className="rating-star">★</span>
        <span className="rating-number">{rating}</span>
      </div>
      <div className="rating-subtext">
        from {reviewCount} stays
      </div>
    </div>
  );
}
