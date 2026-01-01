import React, { useState } from 'react';
import authService from '../services/authService';

const SignupUser = () => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    imageFile: null // This will hold the actual file object
  });

  // Handle Text Inputs
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Handle File Input
  const handleFileChange = (e) => {
    // e.target.files[0] contains the file object
    setFormData({ ...formData, imageFile: e.target.files[0] });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await authService.registerUser(formData);
      console.log('Registered!', response.data);
      // Save token and redirect...
      authService.saveToken(response.data.token);
    } catch (error) {
      console.error('Error:', error.response?.data?.message);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input name="firstName" placeholder="First Name" onChange={handleChange} />
      <input name="lastName" placeholder="Last Name" onChange={handleChange} />
      <input name="email" placeholder="Email" onChange={handleChange} />
      <input name="password" type="password" placeholder="Password" onChange={handleChange} />
      
      {/* File Input */}
      <input type="file" name="image" onChange={handleFileChange} />
      
      <button type="submit">Sign Up</button>
    </form>
  );
};

export default SignupUser;