import { useState } from "react";
import ProductCard from "../../components/ProductCard";
import AddSwapForm from "../../components/AddSwapForm";
import "./Swap.css";

function Swap() {

  const initialProducts = [
    {
      id: 1,
      name: "Engineering Book",
      category: "Books",
      condition: "Good",
      image: ""
    },
    {
      id: 2,
      name: "HP Laptop",
      category: "Electronics",
      condition: "Excellent",
      image: ""
    },
    {
      id: 3,
      name: "Scientific Calculator",
      category: "Accessories",
      condition: "Used",
      image: ""
    }
  ];

  const [products, setProducts] = useState(initialProducts);

  const [swapRequests, setSwapRequests] = useState([]);

  const [editingIndex, setEditingIndex] = useState(null);

  const [searchTerm, setSearchTerm] = useState("");

  const [conditionFilter, setConditionFilter] = useState("All");

  const [categoryFilter, setCategoryFilter] = useState("All");

  const [editName, setEditName] = useState("");

  const [editCategory, setEditCategory] = useState("");

  const [editCondition, setEditCondition] = useState("");


  /* ========================= */
  /* REQUEST SWAP */
  /* ========================= */

  const handleRequestSwap = (productId) => {

    const alreadyRequested = swapRequests.some(
      (request) => request.productId === productId
    );

    if (alreadyRequested) {
      return;
    }

    const newRequest = {
      productId: productId,
      status: "Pending"
    };

    setSwapRequests([...swapRequests, newRequest]);
  };
  const handleAcceptRequest = (productId) => {

  setSwapRequests(
    swapRequests.map((request) => {

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


const handleRejectRequest = (productId) => {

  setSwapRequests(
    swapRequests.map((request) => {

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


  /* ========================= */
  /* FILTER PRODUCTS */
  /* ========================= */

  const filteredProducts = products.filter((product) => {

    const matchesSearch =
      product.name
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||

      product.category
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||

      product.condition
        .toLowerCase()
        .includes(searchTerm.toLowerCase());


    const matchesCondition =
      conditionFilter === "All" ||
      product.condition.toLowerCase() ===
        conditionFilter.toLowerCase();


    const matchesCategory =
      categoryFilter === "All" ||
      product.category.toLowerCase() ===
        categoryFilter.toLowerCase();


    return (
      matchesSearch &&
      matchesCondition &&
      matchesCategory
    );
  });


  /* ========================= */
  /* SAVE EDIT */
  /* ========================= */

  const handleSaveEdit = () => {

    if (
      editName.trim() === "" ||
      editCategory.trim() === "" ||
      editCondition.trim() === ""
    ) {
      alert("Please fill in all fields.");
      return;
    }


    const updatedProducts = products.map((product) => {

      if (product.id === editingIndex) {

        return {
          ...product,
          name: editName.trim(),
          category: editCategory.trim(),
          condition: editCondition.trim()
        };
      }

      return product;
    });


    setProducts(updatedProducts);

    setEditingIndex(null);
  };


  /* ========================= */
  /* PAGE */
  /* ========================= */

  return (

    <div className="swap-container">

      <h1>
        Swap Products
      </h1>


      <p>
        Exchange your used products with other students.
      </p>


      {/* ADD PRODUCT */}

      <AddSwapForm
        products={products}
        setProducts={setProducts}
      />


      {/* SEARCH AND FILTER */}

      <div className="search-filter">

        <label>
          🔎 Find Swap Products
        </label>


        <div className="search-controls">

          <input
            type="text"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
            }}
            placeholder="Search products"
          />


          {/* CONDITION FILTER */}

          <select
            value={conditionFilter}
            onChange={(e) => {
              setConditionFilter(e.target.value);
            }}
          >

            <option value="All">
              All Conditions
            </option>

            <option value="Good">
              Good
            </option>

            <option value="Excellent">
              Excellent
            </option>

            <option value="Used">
              Used
            </option>

          </select>


          {/* CATEGORY FILTER */}

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

            <option value="Electronics">
              Electronics
            </option>

            <option value="Accessories">
              Accessories
            </option>

            <option value="Sports">
              Sports
            </option>

            <option value="Study">
              Study
            </option>

          </select>

        </div>

      </div>


      {/* EDIT FORM */}

      {editingIndex !== null && (

        <div className="edit-form">

          <h2>
            Edit Product
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


          <button onClick={handleSaveEdit}>
            Save Changes
          </button>


          <button
            onClick={() => {
              setEditingIndex(null);
            }}
          >
            Cancel
          </button>

        </div>

      )}


      {/* AVAILABLE PRODUCTS */}

      <h2>
        Available Swap Products
      </h2>


      <p className="product-count">
        📦 {filteredProducts.length} products available
      </p>


      <p className="request-count">
        🔄 {swapRequests.length} swap request(s) sent
      </p>


      {/* PRODUCT LIST */}

      <div className="product-list">

        {filteredProducts.length === 0 ? (

          <p>
            ❌ No products found.
          </p>

        ) : (

          filteredProducts.map((product) => {

            const request = swapRequests.find(
              (item) => item.productId === product.id
            );


            return (

              <ProductCard
                key={product.id}

                name={product.name}

                category={product.category}

                condition={product.condition}

                image={product.image}


                onRequestSwap={() => {
                  handleRequestSwap(product.id);
                }}

                onAccept={() => {
                 handleAcceptRequest(product.id);
                }}

                onReject={() => {
                handleRejectRequest(product.id);
                }}


               swapRequested={
  request && request.status !== "Rejected"
}


                requestStatus={
                  request ? request.status : ""
                }


                onEdit={() => {

                  setEditingIndex(product.id);

                  setEditName(product.name);

                  setEditCategory(product.category);

                  setEditCondition(product.condition);

                }}


                onDelete={() => {

                  const confirmDelete = window.confirm(
                    `Are you sure you want to delete ${product.name}?`
                  );


                  if (confirmDelete) {

                    setProducts(
                      products.filter(
                        (item) => item.id !== product.id
                      )
                    );

                  }

                }}

              />

            );

          })

        )}

      </div>

    </div>

  );
}


export default Swap;