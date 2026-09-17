function ReviewCard({ name, rating, review }) {
  return (
    <div>
      <h3>{name}</h3>

      <p>Rating: {"★".repeat(rating)}</p>

      <p>{review}</p>
    </div>
  );
}

export default ReviewCard;