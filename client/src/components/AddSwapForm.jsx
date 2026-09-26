import { useState } from "react";

function AddSwapForm({ products, setProducts }) {

  const [productName, setProductName] = useState("");
  const [category, setCategory] = useState("");
  const [condition, setCondition] = useState("");
  const [image, setImage] = useState(null);

  const [imageInputKey, setImageInputKey] = useState(0);

  return (
    <div className="add-swap-form">

      <h2>
        Add Product for Swap
      </h2>

      <input
        type="text"
        placeholder="Product Name"
        value={productName}
        onChange={(event) => {
          setProductName(event.target.value);
        }}
      />

      <input
        type="text"
        placeholder="Category"
        value={category}
        onChange={(event) => {
          setCategory(event.target.value);
        }}
      />

      <input
        type="text"
        placeholder="Condition"
        value={condition}
        onChange={(event) => {
          setCondition(event.target.value);
        }}
      />

      <input
        key={imageInputKey}
        type="file"
        accept="image/*"
        onChange={(event) => {
          setImage(event.target.files[0]);
        }}
      />

      <button
        onClick={() => {

  const duplicateProduct = products.some(
    (product) =>
      product.name.toLowerCase() === productName.trim().toLowerCase()
  );

  if (duplicateProduct) {
    alert("A product with this name already exists.");
    return;
  }

  if (
    productName.trim() === "" ||
    category.trim() === "" ||
    condition.trim() === "" ||
    image === null
  ) {
    alert("Please fill in all fields and select a product image.");
    return;
  }

  const newProduct = {
  id: Date.now(),
  name: productName,
  category: category,
  condition: condition,
  image: URL.createObjectURL(image)
};

  setProducts([...products, newProduct]);

  // Reset form
  setProductName("");
  setCategory("");
  setCondition("");
  setImage(null);

  // Clear file input
  setImageInputKey(imageInputKey + 1);

}}
      >
        Add Product
      </button>

    </div>
  );

}

export default AddSwapForm;