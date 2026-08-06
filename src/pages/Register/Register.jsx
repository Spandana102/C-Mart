import { useState } from "react";
import API from "../services/api";

function Register() {

    const [formData, setFormData] = useState({
        fullName: "",
        email: "",
        password: "",
        collegeId: "",
        phoneNumber: ""
    });


    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };


    const handleSubmit = async (e) => {
        e.preventDefault();

        try {

            const response = await API.post(
                "/auth/register",
                formData
            );

            alert(response.data.message);

        } catch(error) {

            alert(error.response.data.message);

        }
    };


    return (
        <div>

            <h2>Register</h2>

            <form onSubmit={handleSubmit}>

                <input
                    type="text"
                    name="fullName"
                    placeholder="Full Name"
                    onChange={handleChange}
                />


                <input
                    type="email"
                    name="email"
                    placeholder="Email"
                    onChange={handleChange}
                />


                <input
                    type="password"
                    name="password"
                    placeholder="Password"
                    onChange={handleChange}
                />


                <input
                    type="text"
                    name="collegeId"
                    placeholder="College ID"
                    onChange={handleChange}
                />


                <input
                    type="text"
                    name="phoneNumber"
                    placeholder="Phone Number"
                    onChange={handleChange}
                />


                <button type="submit">
                    Register
                </button>

            </form>

        </div>
    );
}

export default Register;