function ProductCard(props) {

  const handleRequestSwap = () => {

    const confirmed = window.confirm(
      `Do you want to send a swap request for "${props.name}"?`
    );

    if (confirmed) {

      props.onRequestSwap();

      alert(`Swap request sent to ${props.name}`);

    }

  };


  return (

    <div className="product-card">

      {/* PRODUCT IMAGE */}

      {props.image ? (

        <img
          src={props.image}
          alt={props.name}
        />

      ) : (

        <div className="no-image">

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


      {/* SWAP REQUEST BUTTON */}

      {props.swapRequested ? (

        <button disabled>
          Swap Requested ✓
        </button>

      ) : (

        <button onClick={handleRequestSwap}>
          Request Swap
        </button>

      )}


      {/* REQUEST STATUS */}

      {props.swapRequested && (

        <div>

          <p>
            📌 Status: {props.requestStatus}
          </p>


          {/* PENDING */}

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


          {/* ACCEPTED */}

          {props.requestStatus === "Accepted" && (

            <p>
              🎉 Swap request accepted!
            </p>

          )}


          {/* REJECTED */}

          {props.requestStatus === "Rejected" && (

            <p>
              ❌ Swap request rejected.
            </p>

          )}

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


export default ProductCard;