import React from 'react';
import { useRouter } from 'expo-router';
import { FontAwesome5 } from '@expo/vector-icons';
import './LandingPage.css';

export default function LandingPage() {
    const router = useRouter();

    return (
        <div className="landing-page">
            {/* NAVBAR */}
            <nav className="navbar">
                <div className="container nav-container">
                    <div className="logo">
                        <div style={{ position: 'relative', width: 28, height: 28, marginRight: 8 }}>
                            <FontAwesome5 name="heart" size={28} color="#000" style={{ position: 'absolute' }} />
                            <FontAwesome5 name="heartbeat" size={28} color="#4f46e5" />
                        </div>
                        <span>RuralConnect</span>
                    </div>
                    <div className="nav-buttons">
                        <button className="btn-outline" onClick={() => router.push('/auth/login')}>Login</button>
                        <button className="btn-primary" onClick={() => router.push('/auth/register')}>Sign Up</button>
                    </div>
                </div>
            </nav>

            {/* HERO */}
            <section className="hero">
                <div className="container hero-grid">
                    <div className="hero-left">
                        <h1>Connecting Rural Communities with Quality Healthcare</h1>
                        <p>Patients consult doctors and receive treatment without traveling long distances — medical advice, prescriptions, and follow‑ups, all from home.</p>
                        <div className="hero-buttons">
                            <button className="btn-primary btn-large" onClick={() => router.push('/auth/register')}>Get Started</button>
                            <button className="btn-outline btn-large" onClick={() => router.push('/auth/login')}>Login</button>
                        </div>
                    </div>
                    <div className="hero-right">
                        <img
                            src="https://images.unsplash.com/photo-1581056771107-24ca5f033842?q=80&w=2070&auto=format&fit=crop"
                            alt="Doctor consulting a patient in a calm rural clinic"
                            onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = 'data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22600%22%20height%3D%22400%22%20viewBox%3D%220%200%20600%20400%22%3E%3Crect%20width%3D%22600%22%20height%3D%22400%22%20fill%3D%22%232d375a%22%2F%3E%3Ctext%20x%3D%2230%22%20y%3D%22200%22%20font-family%3D%22Arial%22%20font-size%3D%2220%22%20fill%3D%22%23cbd5e1%22%3Erural%20doctor%20scene%3C%2Ftext%3E%3C%2Fsvg%3E';
                            }}
                        />
                    </div>
                </div>
            </section>

            {/* TRUST */}
            <section className="trust">
                <div className="container trust-grid">
                    <div className="trust-item">
                        <FontAwesome5 name="user-md" size={40} color="#4f46e5" />
                        <div className="trust-text">
                            <h4>Verified Doctors</h4>
                            <p>All practitioners are licensed and reviewed</p>
                        </div>
                    </div>
                    <div className="trust-item">
                        <FontAwesome5 name="lock" size={40} color="#4f46e5" />
                        <div className="trust-text">
                            <h4>Secure Medical Records</h4>
                            <p>Your data is encrypted and private</p>
                        </div>
                    </div>
                    <div className="trust-item">
                        <FontAwesome5 name="bell" size={40} color="#4f46e5" />
                        <div className="trust-text">
                            <h4>Real-time Case Updates</h4>
                            <p>Get notified as soon as your doctor responds</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* HOW IT WORKS */}
            <section className="how-it-works">
                <div className="container">
                    <h2 className="section-title">How it works — simple steps</h2>
                    <div className="steps-row">
                        <div className="step-card">
                            <div className="step-icon"><FontAwesome5 name="edit" size={44} color="#4f46e5" /></div>
                            <h3>1. Submit complaint</h3>
                            <p>Briefly describe symptoms, upload if you have any reports.</p>
                        </div>
                        <div className="step-card">
                            <div className="step-icon"><FontAwesome5 name="stethoscope" size={44} color="#4f46e5" /></div>
                            <h3>2. Doctor reviews</h3>
                            <p>Our general physicians respond with advice or prescription.</p>
                        </div>
                        <div className="step-card">
                            <div className="step-icon"><FontAwesome5 name="calendar-check" size={44} color="#4f46e5" /></div>
                            <h3>3. Follow‑up care</h3>
                            <p>Stay in touch until you feel better — no extra visits needed.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* FEATURES */}
            <section className="features">
                <div className="container">
                    <h2 className="section-title">Care, designed for rural needs</h2>
                    <div className="features-grid">
                        <div className="feature-card">
                            <img src="https://images.unsplash.com/photo-1576091160550-2173dba999ef?q=80&w=2070&auto=format&fit=crop" alt="patient using phone" onError={(e) => e.target.style.backgroundColor = '#262f4f'} />
                            <h4>Easy complaint registration</h4>
                            <p>Describe your issue in your own words, even without internet.</p>
                        </div>
                        <div className="feature-card">
                            <img src="https://images.unsplash.com/photo-1622253692010-333f2da6031d?q=80&w=1964&auto=format&fit=crop" alt="doctor with tablet" onError={(e) => e.target.style.backgroundColor = '#262f4f'} />
                            <h4>Doctor diagnosis online</h4>
                            <p>Receive a medical opinion within hours, not days.</p>
                        </div>
                        <div className="feature-card">
                            <img src="https://images.unsplash.com/photo-1505576399279-565b52d4ac71?q=80&w=1974&auto=format&fit=crop" alt="reminder on phone" onError={(e) => e.target.style.backgroundColor = '#262f4f'} />
                            <h4>Follow-up reminders</h4>
                            <p>Gentle alerts for medications or next consultation.</p>
                        </div>
                        <div className="feature-card">
                            <img src="https://images.unsplash.com/photo-1582719508461-905c673771fd?q=80&w=1925&auto=format&fit=crop" alt="specialist consulting" onError={(e) => e.target.style.backgroundColor = '#262f4f'} />
                            <h4>Specialist escalation</h4>
                            <p>If needed, we connect you to a specialist remotely.</p>
                        </div>
                        <div className="feature-card">
                            <img src="https://images.unsplash.com/photo-1584433144859-1fc3ab64a957?q=80&w=2030&auto=format&fit=crop" alt="health records" onError={(e) => e.target.style.backgroundColor = '#262f4f'} />
                            <h4>Health record history</h4>
                            <p>All your past complaints and prescriptions in one place.</p>
                        </div>
                        <div className="feature-card">
                            <img src="https://images.unsplash.com/photo-1579684288535-1b4ab3d9e0e7?q=80&w=2070&auto=format&fit=crop" alt="community health worker" onError={(e) => e.target.style.backgroundColor = '#262f4f'} />
                            <h4>Multi-role access</h4>
                            <p>Family members or community health workers can assist.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* WHY PLATFORM */}
            <section className="why-platform">
                <div className="container why-grid">
                    <div className="why-text">
                        <h2>Healthcare, closer to home</h2>
                        <p>Rural Health Connect was built because traveling for hours to see a doctor should not be the only option. We work with local clinics and verified physicians to bring primary care, prescriptions, and follow‑ups directly to villagers — using simple mobile tools and a trusted network. The goal: faster help, less travel, better peace of mind.</p>
                    </div>
                    <div className="why-image">
                        <img src="https://images.unsplash.com/photo-1516549655169-df83a0774514?q=80&w=2070&auto=format&fit=crop" alt="village health worker" onError={(e) => e.target.style.backgroundColor = '#262f4f'} />
                    </div>
                </div>
            </section>

            {/* CALL TO ACTION */}
            <section className="cta">
                <div className="container">
                    <h2>Start your healthcare journey today</h2>
                    <div className="cta-buttons">
                        <button className="btn-cta-primary" onClick={() => router.push('/auth/register')}>Create Account</button>
                        <button className="btn-cta-secondary" onClick={() => router.push('/auth/login')}>Sign In</button>
                    </div>
                </div>
            </section>

            {/* FOOTER */}
            <footer className="footer">
                <div className="container footer-content">
                    <div className="footer-logo">
                        <div style={{ position: 'relative', width: 26, height: 26, marginRight: 8 }}>
                            <FontAwesome5 name="heart" size={26} color="#000" style={{ position: 'absolute' }} />
                            <FontAwesome5 name="heartbeat" size={26} color="#4f46e5" />
                        </div>
                        <span>Rural Health Connect</span>
                    </div>
                    <div className="footer-email">
                        <FontAwesome5 name="envelope" size={16} color="#9aa8c0" style={{ marginRight: '6px' }} /> contact@ruralconnect.health
                    </div>
                    <div className="footer-copy">
                        © 2025 Rural Health Connect
                    </div>
                </div>
            </footer>
        </div>
    );
}
