import { useState, useEffect, useContext } from 'react';
import Navbar from '../components/Navbar';
import SnackCard from '../components/snackcard';
import axios from 'axios';
import { API_BASE_URL } from '../utils/api';
import { AuthContext } from '../context/AuthContext';
import { addToCart } from '../utils/cart';
import { useNavigate } from '../hooks/useNavigate';
import toast from 'react-hot-toast';



export default function Concession() {
  const { user, loading: authLoading } = useContext(AuthContext);
  const navigate = useNavigate();
  const urlParams = new URLSearchParams(window.location.search);
  const returnTo = urlParams.get('returnTo') ? decodeURIComponent(urlParams.get('returnTo')) : null;
  const [snacks, setSnacks] = useState([]);
    return <Navigate to="/snacks" replace />;

  }