import { useState } from "react";

function AddRentForm({ rentProducts, setRentProducts }) {

  const [productName, setProductName] = useState("");
  const [category, setCategory] = useState("");
  const [condition, setCondition] = useState("");
  const [rentPrice, setRentPrice] = useState("");
  const [image, setImage] = useState(null);


  const handleAddProduct = () => {

    // VALIDATION

    if (
      productName.trim() === "" ||
      category.trim() === "" ||
      condition.trim() === "" ||
      rentPrice === "" ||
      Number(rentPrice) <= 0 ||
      image === null
    ) {

      alert(
        "Please enter valid product details and a rental price greater than 0."
      );

      return;
    }

        const duplicateProduct = rentProducts.some(
      (product) =>
        product.name.toLowerCase() === productName.trim().toLowerCase()
    );


    if (duplicateProduct) {

      alert("A product with this name already exists.");

      return;
    }


    // CREATE NEW PRODUCT

    const newProduct = {
      id: Date.now(),
      name: productName.trim(),
      category: category.trim(),
      condition: condition.trim(),
      rentPrice: Number(rentPrice),
      image: URL.createObjectURL(image)
    };


    // ADD PRODUCT

    setRentProducts([
      ...rentProducts,
      newProduct
    ]);


    // CLEAR FORM

    setProductName("");
    setCategory("");
    setCondition("");
    setRentPrice("");
    setImage(null);


    alert("Rental product added successfully!");

  };


  return (

    <div className="add-rent-form">

      <h2>
        Add Product for Rent
      </h2>


      <input
        type="text"
        placeholder="Product Name"
        value={productName}
        onChange={(e) => {
          setProductName(e.target.value);
        }}
      />


      <input
        type="text"
        placeholder="Category"
        value={category}
        onChange={(e) => {
          setCategory(e.target.value);
        }}
      />


      <input
        type="text"
        placeholder="Condition"
        value={condition}
        onChange={(e) => {
          setCondition(e.target.value);
        }}
      />


      <input
        type="number"
        placeholder="Rent Price per Day"
        value={rentPrice}
        onChange={(e) => {
          setRentPrice(e.target.value);
        }}
      />


      <input
        type="file"
        accept="image/*"
        onChange={(e) => {
          setImage(e.target.files[0]);
        }}
      />


      <button onClick={handleAddProduct}>
        Add Rental Product
      </button>

    </div>

  );

}


export default AddRentForm;