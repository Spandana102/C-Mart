import { useState } from "react";
import RentProductCard from "../../components/RentProductCard";

import AddRentForm from "../../components/AddRentForm";
import "./Rent.css";

function Rent() {

  const initialRentProducts = [
    {
      id: 1,
      name: "Engineering Book",
      category: "Books",
      condition: "Good",
      rentPrice: 20,
      image: ""
    },
    {
      id: 2,
      name: "Scientific Calculator",
      category: "Accessories",
      condition: "Excellent",
      rentPrice: 30,
      image: ""
    },
    {
      id: 3,
      name: "Drawing Kit",
      category: "Study",
      condition: "Good",
      rentPrice: 40,
      image: ""
    }
  ];


  const [rentProducts, setRentProducts] = useState(
    initialRentProducts
  );

  const [rentRequests, setRentRequests] = useState([]);

  const [rentalDuration, setRentalDuration] = useState({});


  // SEARCH AND FILTER STATES

  const [searchTerm, setSearchTerm] = useState("");

  const [categoryFilter, setCategoryFilter] = useState("All");

  const [conditionFilter, setConditionFilter] = useState("All");


  // EDIT STATES

  const [editingRentProduct, setEditingRentProduct] = useState(null);

  const [editName, setEditName] = useState("");

  const [editCategory, setEditCategory] = useState("");

  const [editCondition, setEditCondition] = useState("");

  const [editRentPrice, setEditRentPrice] = useState("");


  // RENT PRODUCT

  const handleRentNow = (product) => {

    const alreadyRequested = rentRequests.some(
      (request) => request.productId === product.id
    );


    if (alreadyRequested) {

      alert("Rental request already sent.");

      return;
    }


    const days = rentalDuration[product.id] || 1;

    const totalPrice = product.rentPrice * days;

        const confirmed = window.confirm(
      `Do you want to rent "${product.name}" for ${days} day(s)?\nTotal: ₹${totalPrice}`
    );


    if (!confirmed) {

      return;
    }


    const newRequest = {
      productId: product.id,
      days: days,
      totalPrice: totalPrice,
      status: "Pending"
    };


    setRentRequests([
      ...rentRequests,
      newRequest
    ]);


    alert(
      `Rent request sent!\n` +
      `Duration: ${days} day(s)\n` +
      `Total: ₹${totalPrice}`
    );

  };

    // ACCEPT RENT REQUEST

  const handleAcceptRentRequest = (productId) => {

    setRentRequests(
      rentRequests.map((request) => {

        if (request.productId === productId) {

          return {
            ...request,
            status: "Accepted"
          };

        }

        return request;

      })
    );

  };


  // REJECT RENT REQUEST

  const handleRejectRentRequest = (productId) => {

    setRentRequests(
      rentRequests.map((request) => {

        if (request.productId === productId) {

          return {
            ...request,
            status: "Rejected"
          };

        }

        return request;

      })
    );

  };


  // EDIT PRODUCT

  const handleEditRentProduct = (product) => {

    setEditingRentProduct(product.id);

    setEditName(product.name);

    setEditCategory(product.category);

    setEditCondition(product.condition);

    setEditRentPrice(product.rentPrice);

  };


  // UPDATE PRODUCT

  const handleUpdateRentProduct = () => {

    if (
      editName.trim() === "" ||
      editCategory.trim() === "" ||
      editCondition.trim() === "" ||
      Number(editRentPrice) <= 0
    ) {

      alert("Please enter valid product details.");

      return;
    }


    setRentProducts(
      rentProducts.map((product) => {

        if (product.id === editingRentProduct) {

          return {
            ...product,
            name: editName.trim(),
            category: editCategory.trim(),
            condition: editCondition.trim(),
            rentPrice: Number(editRentPrice)
          };

        }

        return product;

      })
    );


    setEditingRentProduct(null);

    alert("Rental product updated successfully!");

  };


   // DELETE PRODUCT

  const handleDeleteRentProduct = (productId) => {

    const confirmed = window.confirm(
      "Are you sure you want to delete this rental product?"
    );

    if (!confirmed) {
      return;
    }

    setRentProducts(
      rentProducts.filter(
        (product) => product.id !== productId
      )
    );

  };


  // FILTER PRODUCTS

  const filteredRentProducts = rentProducts.filter((product) => {

    const matchesSearch =
      product.name
        .toLowerCase()
        .includes(searchTerm.toLowerCase());

    const matchesCategory =
      categoryFilter === "All" ||
      product.category === categoryFilter;

    const matchesCondition =
      conditionFilter === "All" ||
      product.condition === conditionFilter;

    return (
      matchesSearch &&
      matchesCategory &&
      matchesCondition
    );

  });


  return (

    <div className="rent-container">

      <h1>
        Rent Products
      </h1>


      <p>
        Rent useful products from other students for a limited time.
      </p>


      <AddRentForm
        rentProducts={rentProducts}
        setRentProducts={setRentProducts}
      />


      {/* EDIT FORM */}

      {editingRentProduct !== null && (

        <div className="edit-rent-form">

          <h2>
            Edit Rental Product
          </h2>


          <input
            type="text"
            value={editName}
            onChange={(e) => {
              setEditName(e.target.value);
            }}
            placeholder="Product Name"
          />


          <input
            type="text"
            value={editCategory}
            onChange={(e) => {
              setEditCategory(e.target.value);
            }}
            placeholder="Category"
          />


          <input
            type="text"
            value={editCondition}
            onChange={(e) => {
              setEditCondition(e.target.value);
            }}
            placeholder="Condition"
          />


          <input
            type="number"
            value={editRentPrice}
            onChange={(e) => {
              setEditRentPrice(e.target.value);
            }}
            placeholder="Rent Price per Day"
          />


          <button onClick={handleUpdateRentProduct}>
            Update Product
          </button>


          <button
            onClick={() => {
              setEditingRentProduct(null);
            }}
          >
            Cancel
          </button>

        </div>

      )}


      <h2>
        Available Rental Products
      </h2>

            <p>
        Available Products: {filteredRentProducts.length}
      </p>

      {/* SEARCH AND FILTER */}

      <div className="rent-search-filter">

        <input
          type="text"
          placeholder="Search rental products..."
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
          }}
        />


        <select
          value={categoryFilter}
          onChange={(e) => {
            setCategoryFilter(e.target.value);
          }}
        >

          <option value="All">
            All Categories
          </option>

          <option value="Books">
            Books
          </option>

          <option value="Accessories">
            Accessories
          </option>

          <option value="Study">
            Study
          </option>

          <option value="Electronics">
            Electronics
          </option>

        </select>


        <select
          value={conditionFilter}
          onChange={(e) => {
            setConditionFilter(e.target.value);
          }}
        >

          <option value="All">
            All Conditions
          </option>

          <option value="Excellent">
            Excellent
          </option>

          <option value="Good">
            Good
          </option>

          <option value="Used">
            Used
          </option>

        </select>

      </div>


      {/* RENT PRODUCT LIST */}

      <div className="rent-product-list">

        {filteredRentProducts.map((product) => (

          <RentProductCard

            key={product.id}

            name={product.name}

            category={product.category}

            condition={product.condition}

            rentPrice={product.rentPrice}

            image={product.image}


            rentRequested={
              rentRequests.some(
                (request) => request.productId === product.id
              )
            }


            requestStatus={
              rentRequests.find(
                (request) => request.productId === product.id
              )?.status || ""
            }


            rentalDays={
              rentRequests.find(
                (request) => request.productId === product.id
              )?.days || 0
            }


            totalPrice={
              rentRequests.find(
                (request) => request.productId === product.id
              )?.totalPrice || 0
            }


            onDurationChange={(days) => {

              setRentalDuration({

                ...rentalDuration,

                [product.id]: Number(days)

              });

            }}


            onRentNow={() => {

              handleRentNow(product);

            }}


            onEdit={() => {

              handleEditRentProduct(product);

            }}


            onDelete={() => {

              handleDeleteRentProduct(product.id);

            }}

                        onAccept={() => {

              handleAcceptRentRequest(product.id);

            }}


            onReject={() => {

              handleRejectRentRequest(product.id);

            }}

          />

        ))}

      </div>

    </div>

  );

}


export default Rent;