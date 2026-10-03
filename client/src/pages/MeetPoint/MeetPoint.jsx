import { useState } from "react";
import "./MeetPoint.css";


function MeetPoint() {

  const [selectedLocation, setSelectedLocation] = useState("");

  const [selectedDate, setSelectedDate] = useState("");

  const [selectedTime, setSelectedTime] = useState("");

  const [productName, setProductName] = useState("");

  const [isConfirmed, setIsConfirmed] = useState(false);


  const handleConfirm = () => {

    if (
      productName.trim() === "" ||
      selectedLocation === "" ||
      selectedDate === "" ||
      selectedTime === ""
    ) {

      alert(
        "Please enter product name and select location, date and time."
      );

      return;
    }


    setIsConfirmed(true);

  };


  const handleChangeMeetPoint = () => {

    setIsConfirmed(false);

  };


  return (

    <div className="meet-point-container">

      <h1>
        Meet Point
      </h1>


      <p>
        Choose a convenient place to meet for product exchange.
      </p>


      {/* MEET POINT SELECTION */}

      {!isConfirmed && (

        <div className="meet-point-form">

          <h2>
            Select Meet Point
          </h2>


                    {/* PRODUCT */}

          <label>
            Product
          </label>


          <select
            value={productName}
            onChange={(e) => {
              setProductName(e.target.value);
            }}
          >

            <option value="">
              Select a product
            </option>

            <option value="Engineering Book">
              Engineering Book
            </option>

            <option value="Scientific Calculator">
              Scientific Calculator
            </option>

            <option value="HP Laptop">
              HP Laptop
            </option>

            <option value="Drawing Kit">
              Drawing Kit
            </option>

          </select>

          {/* LOCATION */}

          <label>
            Location
          </label>


          <select
            value={selectedLocation}
            onChange={(e) => {
              setSelectedLocation(e.target.value);
            }}
          >

            <option value="">
              Select a location
            </option>

            <option value="College Main Gate">
              College Main Gate
            </option>

            <option value="College Library">
              College Library
            </option>

            <option value="College Canteen">
              College Canteen
            </option>

            <option value="College Ground">
              College Ground
            </option>

          </select>


          {/* DATE */}

          <label>
            Date
          </label>


                    <input
            type="date"
            min={new Date().toISOString().split("T")[0]}
            value={selectedDate}
            onChange={(e) => {
              setSelectedDate(e.target.value);
            }}
          />


          {/* TIME */}

          <label>
            Time
          </label>


          <input
            type="time"
            value={selectedTime}
            onChange={(e) => {
              setSelectedTime(e.target.value);
            }}
          />


                    {/* CONFIRM BUTTON */}

          <button onClick={handleConfirm}>
            Confirm Meet Point
          </button>


          {/* CANCEL BUTTON */}

          <button
            onClick={() => {

              setProductName("");
              setSelectedLocation("");
              setSelectedDate("");
              setSelectedTime("");

            }}
          >
            Clear Selection
          </button>
        </div>

      )}


      {/* CONFIRMATION */}

      {isConfirmed && (

        <div className="meet-point-confirmation">

          <h2>
            ✅ Meet Point Confirmed
          </h2>


          {/* PRODUCT */}

          <div className="confirmation-detail">

            <strong>
              🛍️ Product:
            </strong>

            <span>
              {productName}
            </span>

          </div>


          {/* LOCATION */}

          <div className="confirmation-detail">

            <strong>
              📍 Location:
            </strong>

            <span>
              {selectedLocation}
            </span>

          </div>


          {/* DATE */}

          <div className="confirmation-detail">

            <strong>
              📅 Date:
            </strong>

            <span>
              {selectedDate}
            </span>

          </div>


          {/* TIME */}

          <div className="confirmation-detail">

            <strong>
              ⏰ Time:
            </strong>

            <span>
              {selectedTime}
            </span>

          </div>


          <button onClick={handleChangeMeetPoint}>
            Change Meet Point
          </button>

        </div>

      )}

    </div>

  );

}


export default MeetPoint;