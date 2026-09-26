function RentProductCard(props) {

  return (

    <div className="rent-product-card">

      {/* PRODUCT IMAGE */}

      {props.image ? (

        <img
          src={props.image}
          alt={props.name}
        />

      ) : (

        <div className="rent-no-image">

          📷

          <p>
            No Image
          </p>

        </div>

      )}


      {/* PRODUCT DETAILS */}

      <h3>
        {props.name}
      </h3>

      <p>
        Category: {props.category}
      </p>

      <p>
        Condition: {props.condition}
      </p>

      <p>
        Rent: ₹{props.rentPrice} / day
      </p>


      {/* RENTAL DAYS */}

      <div className="rent-duration">

        <label>
          Rental Days:
        </label>

        <input
          type="number"
          min="1"
          defaultValue="1"
          onChange={(e) => {
            props.onDurationChange(e.target.value);
          }}
        />

      </div>


           {/* RENT BUTTON */}

      {props.rentRequested ? (

        <button disabled>
          Rental Requested ✓
        </button>

      ) : (

        <button onClick={props.onRentNow}>
          Rent Now
        </button>

      )}


      {/* RENT REQUEST INFORMATION */}
      {/* RENT REQUEST INFORMATION */}

      {props.rentRequested && (

               <div className="rent-request-info">

          <p>
            📌 Status: {props.requestStatus}
          </p>


          {props.requestStatus === "Pending" && (

            <p>
              ⏳ Waiting for owner approval.
            </p>

          )}

                    {props.requestStatus === "Pending" && (

            <div>

              <button onClick={props.onAccept}>
                ✅ Accept
              </button>


              <button onClick={props.onReject}>
                ❌ Reject
              </button>

            </div>

          )}

                    {props.requestStatus === "Accepted" && (

            <p>
              🎉 Rental request accepted!
            </p>

          )}


          {props.requestStatus === "Rejected" && (

            <p>
              ❌ Rental request rejected.
            </p>

          )}


          {props.requestStatus === "Accepted" && (

            <p>
              🎉 Rental request accepted!
            </p>

          )}


          {props.requestStatus === "Rejected" && (

            <p>
              ❌ Rental request rejected.
            </p>

          )}


          <p>
            📅 Duration: {props.rentalDays} day(s)
          </p>


          <p>
            💰 Total: ₹{props.totalPrice}
          </p>

        </div>
      )}


      {/* EDIT BUTTON */}

      <button onClick={props.onEdit}>
        Edit
      </button>


      {/* DELETE BUTTON */}

      <button onClick={props.onDelete}>
        Delete
      </button>

    </div>

  );

}

export default RentProductCard;