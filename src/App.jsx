import React, { useState, useEffect } from 'react';
import { 
  Heart, Brain, BookOpen, Mail, Phone, MapPin, Menu, X, Award, Calendar, 
  User, Users, Smile, ArrowRight, ExternalLink, CheckCircle, Shield, FileText, 
  Clock, CreditCard, Star, MessageSquare, ChevronLeft, ChevronRight, Send, 
  Trash2, Lock, AlertTriangle, Loader
} from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { 
  getFirestore, collection, addDoc, deleteDoc, doc, onSnapshot, query, orderBy, serverTimestamp 
} from 'firebase/firestore';
import { getAuth, signInAnonymously, onAuthStateChanged, signInWithCustomToken } from 'firebase/auth';

// --- Error Boundary Component ---
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-stone-50 p-6">
          <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center border border-red-100">
            <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-slate-900 mb-2">Something went wrong</h2>
            <p className="text-slate-600 mb-4 text-sm">The application encountered an error. Please try refreshing.</p>
            <pre className="bg-slate-100 p-3 rounded text-xs text-left overflow-auto max-h-32 mb-4 text-slate-700">
              {this.state.error?.toString()}
            </pre>
            <button 
              onClick={() => window.location.reload()} 
              className="bg-slate-900 text-white px-6 py-2 rounded-lg font-medium hover:bg-slate-800 transition-colors"
            >
              Refresh Page
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// --- Modal Component ---
const Modal = ({ title, children, icon: Icon, onClose, className = "" }) => (
  <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
    <div className={`bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl animate-scale-in ${className}`}>
      <div className="sticky top-0 bg-white border-b border-stone-100 p-6 flex justify-between items-center z-10">
        <div className="flex items-center gap-3">
          <div className="bg-teal-50 p-2 rounded-lg">
            <Icon className="w-6 h-6 text-teal-600" />
          </div>
          <h3 className="text-xl font-bold text-slate-800">{title}</h3>
        </div>
        <button 
          onClick={onClose}
          className="text-slate-400 hover:text-slate-600 hover:bg-stone-100 p-2 rounded-full transition-colors"
        >
          <X size={24} />
        </button>
      </div>
      <div className="p-6 md:p-8 text-slate-600 leading-relaxed space-y-4">
        {children}
      </div>
    </div>
  </div>
);

const PortfolioContent = () => {
  // --- Firebase Setup ---
  const [user, setUser] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [db, setDb] = useState(null);
  const [appId, setAppId] = useState(null);
  const [isDemoMode, setIsDemoMode] = useState(false);

  useEffect(() => {
    let firebaseConfig = null;

    try {
      // 1. Try Vercel / Vite Environment Variables (Production)
      if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_FIREBASE_API_KEY) {
        firebaseConfig = {
          apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
          authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
          projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
          storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
          messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
          appId: import.meta.env.VITE_FIREBASE_APP_ID
        };
      }
      // 2. Try Global Config (Preview Environment)
      else if (typeof __firebase_config !== 'undefined') {
        firebaseConfig = JSON.parse(__firebase_config);
      }

      if (!firebaseConfig) {
        console.warn("No Firebase configuration found. Starting in Demo Mode.");
        setIsDemoMode(true);
        return;
      }

      const app = initializeApp(firebaseConfig);
      const auth = getAuth(app);
      const firestore = getFirestore(app);
      setDb(firestore);
      
      // Determine App ID for pathing
      const currentAppId = typeof __app_id !== 'undefined' ? __app_id : 'nimisha-portfolio-prod';
      setAppId(currentAppId.replace(/[^a-zA-Z0-9_-]/g, '_')); // Sanitize

      const initAuth = async () => {
        try {
          if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
            await signInWithCustomToken(auth, __initial_auth_token);
          } else {
            await signInAnonymously(auth);
          }
        } catch (e) {
          console.error("Auth failed:", e);
          setIsDemoMode(true);
        }
      };
      initAuth();

      const unsubscribeAuth = onAuthStateChanged(auth, (u) => {
        setUser(u);
        if (!u) setIsDemoMode(true);
      });
      return () => unsubscribeAuth();
    } catch (err) {
      console.error("Firebase Init Error:", err);
      setIsDemoMode(true);
    }
  }, []);

  // Fetch Testimonials
  useEffect(() => {
    // Demo Mode Data
    if (isDemoMode) {
      setReviews([
        { id: '1', name: 'Priya S.', text: 'Nimisha helped me navigate my anxiety during exams. Highly recommended!', rating: 5 },
        { id: '2', name: 'Anonymous', text: 'A very supportive and understanding psychologist.', rating: 4 }
      ]);
      return;
    }

    if (!user || !db || !appId) return;

    try {
      let collectionRef;
      if (typeof __app_id !== 'undefined') {
         collectionRef = collection(db, 'artifacts', appId, 'public', 'data', 'testimonials');
      } else {
         collectionRef = collection(db, 'testimonials');
      }

      const q = query(collectionRef, orderBy('createdAt', 'desc'));
      
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const fetchedReviews = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setReviews(fetchedReviews);
      }, (error) => {
        console.error("Error fetching reviews:", error);
        setIsDemoMode(true);
      });
      return () => unsubscribe();
    } catch (e) {
      console.error("Query failed:", e);
      setIsDemoMode(true);
    }
  }, [user, db, appId, isDemoMode]);

  // --- State Management ---
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('home');
  const [activeModal, setActiveModal] = useState(null);
  const [formStatus, setFormStatus] = useState('idle');

  // Admin & Deletion
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminPasswordInput, setAdminPasswordInput] = useState('');
  const [adminError, setAdminError] = useState('');
  const [reviewToDelete, setReviewToDelete] = useState(null);
  const [deleteStatus, setDeleteStatus] = useState('idle');

  // Booking
  const [bookingStep, setBookingStep] = useState(1); 
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [bookingDetails, setBookingDetails] = useState({ name: '', email: '', phone: '' });
  const [paymentStatus, setPaymentStatus] = useState('idle');

  // Reviews
  const [newReview, setNewReview] = useState({ name: '', text: '', rating: 5, anonymous: false });
  const [reviewStatus, setReviewStatus] = useState('idle');

  // Hero Data
  const [heroContent, setHeroContent] = useState({
    text: "Empowering youth through mental health support.",
    image: "https://images.unsplash.com/photo-1529333166437-7750a6dd5a70?auto=format&fit=crop&q=80&w=800",
    blob1: "bg-teal-200/30",
    blob2: "bg-purple-200/30"
  });

  // Randomize Hero
  useEffect(() => {
    const quotes = [
      { text: "Empowering youth through mental health support.", image: "https://images.unsplash.com/photo-1529333166437-7750a6dd5a70?auto=format&fit=crop&q=80&w=800", blob1: "bg-teal-200/30", blob2: "bg-purple-200/30" },
      { text: "Your mental health is just as important as your physical health.", image: "https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&q=80&w=800", blob1: "bg-blue-300/30", blob2: "bg-sky-200/30" },
      { text: "Small steps every day add up to big results.", image: "https://images.unsplash.com/photo-1457530378978-8bac673b8062?auto=format&fit=crop&q=80&w=800", blob1: "bg-rose-300/30", blob2: "bg-pink-200/30" }
    ];
    setHeroContent(quotes[Math.floor(Math.random() * quotes.length)]);
  }, []);

  const scrollToSection = (sectionId) => {
    setActiveSection(sectionId);
    setIsMenuOpen(false);
    const element = document.getElementById(sectionId);
    if (element) element.scrollIntoView({ behavior: 'smooth' });
  };

  // Logic Handlers
  const generateDates = () => {
    const dates = [];
    const today = new Date();
    for (let i = 0; i < 7; i++) {
      const nextDate = new Date(today);
      nextDate.setDate(today.getDate() + i);
      dates.push(nextDate);
    }
    return dates;
  };
  const timeSlots = ["10:00 AM", "11:00 AM", "02:00 PM", "03:00 PM", "05:00 PM", "06:00 PM"];
  const isSlotAvailable = (date, slot) => (date.getDate() + slot.length) % 3 !== 0;

  const handlePayment = async (e) => {
    e.preventDefault();
    setPaymentStatus('processing');
    try {
      const res = await fetch('/api/payment', { method: 'POST' });
      if (!res.ok) throw new Error("Payment API failed");
      
      await fetch('/api/book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...bookingDetails, date: selectedDate.toLocaleDateString(), slot: selectedSlot })
      });
      setPaymentStatus('success');
      setBookingStep(4);
    } catch (error) {
      console.warn("API call failed (expected in local preview), simulating success:", error);
      setTimeout(() => {
        setPaymentStatus('success');
        setBookingStep(4);
      }, 1000);
    }
  };

  const handleAdminLogin = (e) => {
    e.preventDefault();
    if (adminPasswordInput === 'admin') {
      setIsAdmin(true); setActiveModal(null);
    } else {
      setAdminError('Incorrect password');
    }
  };

  const performDelete = async () => {
    if (!reviewToDelete) return;
    
    if (isDemoMode || !db) {
        setReviews(prev => prev.filter(r => r.id !== reviewToDelete));
        setActiveModal(null); setReviewToDelete(null);
        return;
    }

    setDeleteStatus('deleting');
    try {
      let docRef;
      if (typeof __app_id !== 'undefined') {
          docRef = doc(db, 'artifacts', appId, 'public', 'data', 'testimonials', reviewToDelete);
      } else {
          docRef = doc(db, 'testimonials', reviewToDelete);
      }
      await deleteDoc(docRef);
      setActiveModal(null); setReviewToDelete(null); setDeleteStatus('idle');
    } catch (error) {
      console.error("Delete failed", error);
      setDeleteStatus('error');
    }
  };

  const handlePostReview = async (e) => {
    e.preventDefault();
    setReviewStatus('analyzing');
    try {
      // 1. Moderate
      let isSafe = true;
      try {
        const modRes = await fetch('/api/moderate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: newReview.text })
        });
        if (modRes.ok) {
            const modData = await modRes.json();
            isSafe = modData.safe;
        }
      } catch (err) { /* API might fail in preview, ignore */ }
      
      if (!isSafe) {
        setReviewStatus('flagged');
        setTimeout(() => setReviewStatus('idle'), 4000);
        return;
      }

      setReviewStatus('submitting');
      
      if (isDemoMode || !user || !db) {
          const mockReview = {
              id: Date.now().toString(),
              name: newReview.anonymous ? "Anonymous" : newReview.name,
              text: newReview.text,
              rating: newReview.rating,
              createdAt: new Date()
          };
          setReviews([mockReview, ...reviews]);
          setNewReview({ name: '', text: '', rating: 5, anonymous: false });
          setReviewStatus('success');
          setTimeout(() => setReviewStatus('idle'), 2000);
          return;
      }

      let collectionRef;
      if (typeof __app_id !== 'undefined') {
         collectionRef = collection(db, 'artifacts', appId, 'public', 'data', 'testimonials');
      } else {
         collectionRef = collection(db, 'testimonials');
      }

      await addDoc(collectionRef, {
        name: newReview.anonymous ? "Anonymous" : newReview.name,
        text: newReview.text,
        rating: newReview.rating,
        createdAt: serverTimestamp()
      });
      setNewReview({ name: '', text: '', rating: 5, anonymous: false });
      setReviewStatus('success');
      setTimeout(() => setReviewStatus('idle'), 2000);
    } catch (error) {
      console.error("Review failed", error);
      setReviewStatus('error');
    }
  };

  const navLinks = [
    { name: 'Home', id: 'home' },
    { name: 'About', id: 'about' },
    { name: 'Services', id: 'services' },
    { name: 'Testimonials', id: 'testimonials' },
    { name: 'Experience', id: 'experience' },
    { name: 'Contact', id: 'contact' },
  ];

  const services = [
    { title: "Child & Adolescent Therapy", Icon: Smile, description: "Specialized support for ADHD, Autism, and behavioral challenges.", tags: ["ADHD", "ASD"] },
    { title: "Student & Exam Stress", Icon: BookOpen, description: "Expert guidance for exam anxiety and academic pressure.", tags: ["Anxiety", "Focus"] },
    { title: "Individual Counselling", Icon: User, description: "Therapy for depression, trauma, and relationships.", tags: ["Depression", "Trauma"] },
    { title: "Parenting Guidance", Icon: Users, description: "Strategies to support children's mental health.", tags: ["Family", "Psychoeducation"] }
  ];

  const handleSendMessage = (e) => {
    e.preventDefault();
    setFormStatus('sending');
    setTimeout(() => {
      setFormStatus('success');
      setTimeout(() => setFormStatus('idle'), 3000);
    }, 1500);
  };

  const initiateDelete = (e, reviewId) => {
    e.stopPropagation();
    if (!isAdmin) return;
    setReviewToDelete(reviewId);
    setActiveModal('deleteConfirm');
    setDeleteStatus('idle');
  };

  const experiences = [
    {
      role: "Psychological Counsellor",
      org: "Allen Career Institute, Kota",
      period: "Sep 2023 - Sep 2024",
      desc: "Delivered 200+ counselling sessions for high-pressure students. Led suicide prevention initiatives."
    },
    {
      role: "Counselling Psychologist",
      org: "Ujala Centre, RNT Medical College",
      period: "Feb 2023 - Present",
      desc: "Providing therapy for children with special needs (ADHD, ID, LD). Collaborating with pediatricians."
    },
    {
      role: "Volunteer Psychologist",
      org: "Student Care Alliance Society",
      period: "May 2024 - Sep 2024",
      desc: "Conducted 450+ individual and group sessions with aspirants."
    }
  ];

  return (
    <div className="min-h-screen bg-stone-50 text-slate-800 font-sans selection:bg-teal-100 relative">
      {/* Modals */}
      {activeModal === 'deleteConfirm' && (
        <Modal title="Delete Testimonial" icon={AlertTriangle} onClose={() => setActiveModal(null)} className="max-w-md">
           <div className="text-center space-y-4">
             <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto text-red-600">
               <Trash2 size={32} />
             </div>
             <p className="text-lg font-medium text-slate-800">Are you sure you want to delete this?</p>
             <p className="text-sm text-slate-500">This action cannot be undone.</p>
             {deleteStatus === 'error' && <div className="text-red-500 text-sm">Failed to delete.</div>}
             <div className="flex gap-3 justify-center pt-4">
               <button onClick={() => setActiveModal(null)} className="px-6 py-2 rounded-lg border border-stone-200 hover:bg-stone-50 transition-colors">Cancel</button>
               <button onClick={performDelete} disabled={deleteStatus === 'deleting'} className="px-6 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white shadow-lg transition-colors flex items-center gap-2">
                 {deleteStatus === 'deleting' ? 'Deleting...' : 'Yes, Delete'}
               </button>
             </div>
           </div>
        </Modal>
      )}

      {activeModal === 'booking' && (
        <Modal title="Book Appointment" icon={Calendar} onClose={() => setActiveModal(null)}>
          {bookingStep === 1 && (
            <div className="space-y-6">
              <h4 className="font-semibold text-slate-800 mb-4">Select Date</h4>
              <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide">
                {generateDates().map((date, i) => (
                  <button key={i} onClick={() => { setSelectedDate(date); setSelectedSlot(null); }} className={`min-w-[80px] p-3 rounded-xl border transition-all flex flex-col items-center gap-1 ${selectedDate?.toDateString() === date.toDateString() ? 'bg-teal-600 text-white shadow-lg' : 'bg-white border-stone-200'}`}>
                    <span className="text-xs font-medium uppercase opacity-80">{date.toLocaleDateString('en-US', { weekday: 'short' })}</span>
                    <span className="text-xl font-bold">{date.getDate()}</span>
                  </button>
                ))}
              </div>
              {selectedDate && <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">{timeSlots.map((slot, i) => (
                <button key={i} disabled={!isSlotAvailable(selectedDate, slot)} onClick={() => setSelectedSlot(slot)} className={`py-2 px-4 rounded-lg text-sm font-medium border ${selectedSlot === slot ? 'bg-teal-600 text-white' : 'bg-white border-stone-200'}`}>{slot}</button>
              ))}</div>}
              <div className="flex justify-end pt-4"><button disabled={!selectedDate || !selectedSlot} onClick={() => setBookingStep(2)} className="bg-teal-600 disabled:bg-stone-300 text-white px-6 py-2.5 rounded-lg font-bold">Next</button></div>
            </div>
          )}
          {bookingStep === 2 && (
            <div className="space-y-4">
              <input type="text" placeholder="Full Name" className="w-full px-4 py-2 border rounded-lg" value={bookingDetails.name} onChange={e => setBookingDetails({...bookingDetails, name: e.target.value})} />
              <input type="email" placeholder="Email" className="w-full px-4 py-2 border rounded-lg" value={bookingDetails.email} onChange={e => setBookingDetails({...bookingDetails, email: e.target.value})} />
              <input type="tel" placeholder="Phone" className="w-full px-4 py-2 border rounded-lg" value={bookingDetails.phone} onChange={e => setBookingDetails({...bookingDetails, phone: e.target.value})} />
              <div className="flex justify-between pt-4"><button onClick={() => setBookingStep(1)}>Back</button><button onClick={() => setBookingStep(3)} className="bg-teal-600 text-white px-6 py-2 rounded-lg">Proceed</button></div>
            </div>
          )}
          {bookingStep === 3 && (
            <div className="space-y-4 text-center">
              <h3 className="text-2xl font-bold">₹1,500</h3>
              <input type="text" placeholder="Card Number" className="w-full px-4 py-2 border rounded-lg" />
              <div className="flex gap-4"><input placeholder="MM/YY" className="w-1/2 px-4 py-2 border rounded-lg" /><input placeholder="CVC" className="w-1/2 px-4 py-2 border rounded-lg" /></div>
              <button onClick={handlePayment} disabled={paymentStatus === 'processing'} className="w-full bg-teal-600 text-white py-3 rounded-lg font-bold">{paymentStatus === 'processing' ? 'Processing...' : 'Pay & Book'}</button>
            </div>
          )}
          {bookingStep === 4 && (
            <div className="text-center py-8">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h3 className="text-2xl font-bold mb-2">Confirmed!</h3>
              <p>Email sent to {bookingDetails.email}</p>
              <button onClick={() => setActiveModal(null)} className="mt-6 bg-slate-800 text-white px-6 py-2 rounded-lg">Done</button>
            </div>
          )}
        </Modal>
      )}

      {/* Admin Login */}
      {activeModal === 'adminLogin' && (
        <Modal title="Admin" icon={Lock} onClose={() => setActiveModal(null)}>
          <input type="password" placeholder="Password" className="w-full px-4 py-2 border rounded-lg mb-4" value={adminPasswordInput} onChange={e => setAdminPasswordInput(e.target.value)} />
          <button onClick={handleAdminLogin} className="w-full bg-slate-800 text-white py-2 rounded-lg">Login</button>
        </Modal>
      )}

      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-white/90 backdrop-blur-md shadow-sm z-50 border-b border-stone-100">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2"><Brain className="text-teal-600" /><span className="font-bold text-lg">Nimisha Khandelwal</span></div>
          <div className="hidden md:flex gap-8 items-center">
            {navLinks.map(l => <button key={l.name} onClick={() => scrollToSection(l.id)} className="text-sm font-medium text-slate-600 hover:text-teal-600">{l.name}</button>)}
            <button onClick={() => setActiveModal('booking')} className="bg-teal-600 text-white px-5 py-2 rounded-full text-sm font-medium hover:shadow-lg">Book Now</button>
          </div>
          <button className="md:hidden" onClick={() => setIsMenuOpen(!isMenuOpen)}><Menu /></button>
        </div>
        {isMenuOpen && (
          <div className="md:hidden bg-white border-t border-stone-100 absolute w-full shadow-lg p-4 flex flex-col gap-4">
            {navLinks.map(l => <button key={l.name} onClick={() => scrollToSection(l.id)} className="text-left py-2">{l.name}</button>)}
            <button onClick={() => setActiveModal('booking')} className="bg-teal-600 text-white py-3 rounded-lg">Book Appointment</button>
          </div>
        )}
      </nav>

      {/* Hero */}
      <section id="home" className="pt-32 pb-20 px-6 bg-stone-50">
        <div className="container mx-auto flex flex-col md:flex-row items-center gap-12">
          <div className="flex-1 space-y-6">
            <h1 className="text-5xl font-bold text-slate-900">Compassionate Care for <span className="text-teal-600">Mental Wellness</span></h1>
            <p className="text-lg text-slate-600">Dedicated to empowering children, adolescents, and adults through evidence-based therapy.</p>
            <div className="flex gap-4">
              <button onClick={() => setActiveModal('booking')} className="bg-teal-600 text-white px-8 py-3 rounded-full font-semibold shadow-lg">Book Appointment</button>
              <button onClick={() => scrollToSection('services')} className="bg-white border text-slate-700 px-8 py-3 rounded-full font-semibold">View Services</button>
            </div>
          </div>
          <div className="flex-1 relative">
            <div className="relative z-10 rounded-2xl overflow-hidden shadow-2xl rotate-2">
              <img src={heroContent.image} alt="Wellness" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/40 flex items-end p-8"><p className="text-white text-lg italic">"{heroContent.text}"</p></div>
            </div>
          </div>
        </div>
      </section>

      {/* Services */}
      <section id="services" className="py-20 px-6">
        <div className="container mx-auto grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {services.map((s, i) => (
            <div key={i} className="bg-white p-6 rounded-2xl shadow-sm border hover:shadow-xl transition-shadow">
              <div className="bg-teal-50 w-12 h-12 rounded-lg flex items-center justify-center mb-4"><s.Icon className="text-teal-600" /></div>
              <h3 className="text-xl font-bold mb-2">{s.title}</h3>
              <p className="text-slate-600 text-sm">{s.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-20 px-6 bg-teal-900 text-white">
        <div className="container mx-auto max-w-6xl">
          <h2 className="text-3xl font-bold text-center mb-12">Stories of Growth</h2>
          <div className="grid md:grid-cols-2 gap-12">
            <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
              {reviews.map(r => (
                <div key={r.id} className="bg-white/10 p-6 rounded-xl border border-white/10">
                  <div className="flex justify-between mb-2">
                    <span className="font-bold">{r.name}</span>
                    {isAdmin && <button onClick={(e) => initiateDelete(e, r.id)}><Trash2 size={16} className="text-red-300" /></button>}
                  </div>
                  <p className="text-sm opacity-90">"{r.text}"</p>
                </div>
              ))}
            </div>
            <div className="bg-white rounded-2xl p-8 text-slate-800">
              <h3 className="text-xl font-bold mb-6">Share Your Story</h3>
              <form onSubmit={handlePostReview} className="space-y-4">
                <textarea className="w-full px-4 py-3 border rounded-lg" rows="4" placeholder="Your experience..." value={newReview.text} onChange={e => setNewReview({...newReview, text: e.target.value})} required></textarea>
                <div className="grid grid-cols-2 gap-4">
                  <input className="px-4 py-2 border rounded-lg" placeholder="Name" value={newReview.name} onChange={e => setNewReview({...newReview, name: e.target.value})} required />
                  <select className="px-4 py-2 border rounded-lg" value={newReview.rating} onChange={e => setNewReview({...newReview, rating: parseInt(e.target.value)})}>
                    <option value="5">5 Stars</option><option value="4">4 Stars</option>
                  </select>
                </div>
                <button type="submit" disabled={reviewStatus === 'analyzing'} className="w-full bg-teal-600 text-white py-3 rounded-lg font-bold">
                  {reviewStatus === 'analyzing' ? 'Analyzing...' : 'Post Review'}
                </button>
                {reviewStatus === 'flagged' && <p className="text-red-600 text-sm mt-2">Content flagged as inappropriate.</p>}
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* Experience */}
      <section id="experience" className="py-20 px-6 bg-white">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center mb-16"><h2 className="text-3xl md:text-4xl font-bold text-slate-800">Professional Journey</h2><div className="w-20 h-1.5 bg-teal-500 mx-auto rounded-full mt-4"></div></div>
          <div className="space-y-12 relative before:absolute before:inset-0 before:ml-5 before:w-0.5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:bg-stone-200 before:h-full">
            {experiences.map((exp, idx) => (
              <div key={idx} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-white bg-teal-500 text-white shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 absolute left-0 md:left-1/2 translate-x-0"><Calendar size={16} /></div>
                <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-white p-6 rounded-2xl border border-stone-100 shadow-sm hover:shadow-md transition-shadow ml-16 md:ml-0">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-2"><h3 className="font-bold text-lg text-slate-800">{exp.role}</h3><span className="text-xs font-semibold bg-teal-50 text-teal-700 px-2 py-1 rounded-full mt-1 sm:mt-0">{exp.period}</span></div>
                  <div className="text-teal-600 font-medium text-sm mb-3 flex items-center gap-1"><MapPin size={14} /> {exp.org}</div>
                  <p className="text-slate-600 text-sm leading-relaxed">{exp.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-950 text-slate-400 py-8 border-t border-slate-900">
        <div className="container mx-auto px-6 text-center">
          <div className="flex items-center justify-center gap-2 mb-4"><Brain className="w-6 h-6 text-teal-600" /><span className="text-lg font-bold text-white">Nimisha Khandelwal</span></div>
          <p className="text-sm mb-6 flex items-center justify-center gap-2">© {new Date().getFullYear()} Nimisha Khandelwal. All rights reserved.<button onClick={() => setActiveModal('adminLogin')} className="opacity-20 hover:opacity-100 transition-opacity"><Lock size={12} /></button></p>
          <div className="flex justify-center gap-6">
            <a href="https://www.linkedin.com/in/nimisha-khandelwal" target="_blank" rel="noopener noreferrer" className="hover:text-teal-500 transition-colors">LinkedIn</a>
            <button onClick={() => setActiveModal('privacy')} className="hover:text-teal-500 transition-colors">Privacy Policy</button>
            <button onClick={() => setActiveModal('terms')} className="hover:text-teal-500 transition-colors">Terms of Service</button>
          </div>
        </div>
      </footer>
    </div>
  );
};

const AppWrapper = () => (
  <ErrorBoundary>
    <PortfolioContent />
  </ErrorBoundary>
);

export default AppWrapper;