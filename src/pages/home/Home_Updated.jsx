import { useEffect, useState } from "react";

export default function LandingPage() {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const API_BASE =
        window.location.hostname === "localhost"
            ? "http://localhost:3000"
            : "https://apih.ant-tech.asia";

    // FETCH JOBS
    const fetchJobs = async (limit = 9) => {
        setLoading(true);
        setError("");

        try {
            const res = await fetch(`${API_BASE}/local/jobs`);
            if (!res.ok) throw new Error("Fail");

            let data = await res.json();
            let jobsList = data.jobs || [];

            if (limit) jobsList = jobsList.slice(0, limit);

            setJobs(jobsList);
        } catch (err) {
            setError("Không tải được danh sách công việc");
        } finally {
            setLoading(false);
        }
    };

    // SCROLL ANIMATION & ICONS
    useEffect(() => {
        fetchJobs();
    }, []);

    useEffect(() => {
        const observerOptions = {
            threshold: 0.15,
            rootMargin: "0px 0px -50px 0px",
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    const target = entry.target;

                    if (target.classList.contains("reveal-stagger")) {
                        const items = target.querySelectorAll(".reveal-item");
                        items.forEach((item, index) => {
                            setTimeout(() => {
                                item.classList.add("visible");
                            }, index * 150);
                        });
                        target.classList.add("visible");
                        observer.unobserve(target);
                    } else {
                        target.classList.add("visible");
                        observer.unobserve(target);
                    }
                }
            });
        }, observerOptions);

        document
            .querySelectorAll(
                ".reveal-up, .reveal-left, .reveal-right, .reveal-stagger"
            )
            .forEach((el) => observer.observe(el));

        // Lucide init
        if (window.lucide) {
            window.lucide.createIcons();
        }

        return () => observer.disconnect();
    }, [jobs, loading]); // Re-run when jobs are loaded or loading status changes

    return (
        <div className="font-sans text-text-medium bg-white antialiased">
            <main>
                {/* Hero Section */}
                <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden bg-bg-light">
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full -z-10">
                        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-primary/10 blur-[120px] rounded-full"></div>
                        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-accent/10 blur-[120px] rounded-full"></div>
                    </div>

                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center reveal-stagger">
                        <div>
                            <span className="inline-block py-1 px-3 rounded-full bg-primary/5 border border-primary/10 text-primary text-xs font-bold uppercase tracking-wider mb-6 reveal-item">
                                The Future of Tech Hiring in Asia
                            </span>
                            <h1 className="text-5xl lg:text-7xl font-display font-bold text-text-dark mb-8 leading-[1.1] reveal-item">
                                Connect with the <span className="text-gradient">Top 1%</span> <br />
                                Tech Talent in Asia
                            </h1>
                            <p className="text-lg lg:text-xl text-text-medium max-w-2xl mx-auto mb-10 leading-relaxed reveal-item">
                                AntTech Asia is the premier recruitment platform for high-growth startups and tech giants
                                looking to scale their engineering teams across the continent.
                            </p>
                            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 reveal-item">
                                <button
                                    onClick={() => window.location.href = '/login'}
                                    className="w-full sm:w-auto text-lg px-8 py-4 flex items-center justify-center gap-2 hover:scale-105 transition-transform"
                                >
                                    Find Your Next Role <i data-lucide="arrow-right" className="w-5 h-5"></i>
                                </button>
                                <button
                                    onClick={() => window.location.href = '/login'}
                                    className="w-full sm:w-auto text-lg px-8 py-4 hover:scale-105 transition-transform"
                                >
                                    Hire Top Talent
                                </button>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Featured Jobs */}
                <section className="py-24 px-4 reveal-stagger" id="jobs">
                    <div className="max-w-7xl mx-auto">
                        <div className="flex justify-between items-end mb-12 reveal-item">
                            <div>
                                <h2 className="text-3xl font-display font-bold text-text-dark mb-4">Featured Opportunities</h2>
                                <p className="text-text-light">Hand-picked roles from top tech companies in Asia.</p>
                            </div>
                            <button
                                onClick={() => window.location.href = '/login'}
                                className="hidden sm:flex items-center gap-2 text-primary font-semibold hover:text-accent transition-colors"
                            >
                                View all jobs <i data-lucide="chevron-right" className="w-4 h-4"></i>
                            </button>
                        </div>

                        <div id="jobsContainer" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-3 gap-8">
                            {loading ? (
                                <div className="col-span-full text-center py-8 text-text-light">Loading jobs...</div>
                            ) : error ? (
                                <div className="col-span-full text-center py-8 text-red-500">{error}</div>
                            ) : jobs.length === 0 ? (
                                <div className="col-span-full text-center py-8 text-text-light">No jobs available.</div>
                            ) : (
                                jobs.map((job, index) => (
                                    <div
                                        key={job._id || index}
                                        className="glass-card p-6 flex flex-col h-full bg-white hover:border-primary/40 transition-all duration-300 cursor-pointer group reveal-item"
                                        onClick={() => window.location.href = `/job/${job._id}`}
                                    >
                                        <div className="flex justify-between items-start mb-6">
                                            <div className="w-10 h-10 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center">
                                                <i data-lucide="briefcase" className="w-5 h-5 text-gray-400"></i>
                                            </div>
                                            <span className="px-3 py-1 rounded-full bg-gray-100/50 text-[10px] font-semibold text-gray-500 lowercase first-letter:uppercase">
                                                {job.type || 'Full-time'}
                                            </span>
                                        </div>

                                        <h3 className="text-lg font-bold text-text-dark mb-1 group-hover:text-primary transition-colors leading-tight">
                                            {job.title}
                                        </h3>
                                        <p className="text-gray-400 text-xs mb-4 flex items-center gap-1">
                                            <i data-lucide="map-pin" className="w-3 h-3"></i> {job.location || 'Remote/Onsite'}
                                        </p>
                                        <div className="flex flex-wrap gap-2 mb-6">
                                            {(job.keywords || []).slice(0, 3).map((k, i) => (
                                                <span key={i} className="px-2 py-1 rounded border border-primary/20 bg-primary/5 text-[9px] font-bold text-primary uppercase tracking-wider">
                                                    {k}
                                                </span>
                                            ))}
                                            {/* FALLBACK IF NO KEYWORDS */}
                                            {(!job.keywords || job.keywords.length === 0) && (
                                                <>
                                                    <span className="px-2 py-1 rounded border border-primary/20 bg-primary/5 text-[9px] font-bold text-primary uppercase tracking-wider">
                                                        REMOTE
                                                    </span>
                                                    <span className="px-2 py-1 rounded border border-primary/20 bg-primary/5 text-[9px] font-bold text-primary uppercase tracking-wider">
                                                        GUARANTEE 3 MONTHS
                                                    </span>
                                                </>
                                            )}
                                        </div>

                                        <div className="pt-4 border-t border-gray-100 flex justify-between items-center mt-auto">
                                            <div className="flex flex-col">
                                                <span className="text-[10px] text-gray-400 font-medium lowercase first-letter:uppercase">monthly salary</span>
                                                <span className="text-sm font-bold text-text-dark">{job.salary || 'Negotiable'}</span>
                                            </div>
                                            <span className="text-xs font-semibold text-gray-500 group-hover:text-primary flex items-center gap-1 transition-colors">
                                                View Details <i data-lucide="arrow-right" className="w-3 h-3"></i>
                                            </span>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </section>

                {/* Split Section */}
                <section className="py-24 bg-bg-light border-y border-border-light px-4 reveal-stagger">
                    <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12">
                        {/* For Companies */}
                        <div className="glass-card p-10 relative overflow-hidden group reveal-item">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 blur-3xl -mr-16 -mt-16 group-hover:bg-primary/10 transition-all"></div>
                            <i data-lucide="building-2" className="w-12 h-12 text-primary mb-6"></i>
                            <h2 className="text-3xl font-display font-bold text-text-dark mb-4">For Companies</h2>
                            <p className="text-text-medium mb-8 leading-relaxed">
                                Scale your engineering team with pre-vetted tech talent. Our platform uses AI to match you with
                                candidates who fit your technical requirements and culture.
                            </p>
                            <ul className="space-y-4 mb-10">
                                <li className="flex items-center gap-3 text-text-medium"><i data-lucide="check-circle-2" className="w-5 h-5 text-accent"></i> Access to top 1% tech talent in Asia</li>
                                <li className="flex items-center gap-3 text-text-medium"><i data-lucide="check-circle-2" className="w-5 h-5 text-accent"></i> AI-powered candidate matching</li>
                                <li className="flex items-center gap-3 text-text-medium"><i data-lucide="check-circle-2" className="w-5 h-5 text-accent"></i> Dedicated account manager</li>
                            </ul>
                            <button onClick={() => window.location.href = '/login'} className="w-full sm:w-auto btn-primary border-accent/20 hover:bg-accent/5">Start Hiring</button>
                        </div>

                        {/* For Headhunters */}
                        <div className="glass-card p-10 relative overflow-hidden group reveal-item">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-accent/5 blur-3xl -mr-16 -mt-16 group-hover:bg-accent/10 transition-all"></div>
                            <i data-lucide="users" className="w-12 h-12 text-accent mb-6"></i>
                            <h2 className="text-3xl font-display font-bold text-text-dark mb-4">For Headhunters</h2>
                            <p className="text-text-medium mb-8 leading-relaxed">
                                Monetize your network. Refer top candidates to our exclusive job openings and earn
                                industry-leading commissions on every successful placement.
                            </p>
                            <ul className="space-y-4 mb-10">
                                <li className="flex items-center gap-3 text-text-medium"><i data-lucide="check-circle-2" className="w-5 h-5 text-primary"></i> Earn up to 20% commission per hire</li>
                                <li className="flex items-center gap-3 text-text-medium"><i data-lucide="check-circle-2" className="w-5 h-5 text-primary"></i> Access to exclusive high-paying roles</li>
                                <li className="flex items-center gap-3 text-text-medium"><i data-lucide="check-circle-2" className="w-5 h-5 text-primary"></i> Real-time referral tracking</li>
                            </ul>
                            <button onClick={() => window.location.href = '/login'} className="btn-secondary w-full sm:w-auto border-accent/20 hover:bg-accent/5">Become a Partner</button>
                        </div>
                    </div>
                </section>

                {/* How It Works */}
                <section className="py-24 px-4 reveal-stagger">
                    <div className="max-w-7xl mx-auto text-center">
                        <h2 className="text-4xl font-display font-bold text-text-dark mb-16 reveal-item">How It Works</h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative">
                            <div className="hidden md:block absolute top-1/2 left-1/4 right-1/4 h-0.5 bg-gradient-to-r from-primary/10 via-accent/10 to-primary/10 -translate-y-12 -z-10"></div>

                            <div className="flex flex-col items-center reveal-item">
                                <div className="w-20 h-20 rounded-2xl bg-bg-gray border border-border-light flex items-center justify-center mb-6 shadow-md">
                                    <i data-lucide="users" className="w-8 h-8 text-primary"></i>
                                </div>
                                <h3 className="text-xl font-bold text-text-dark mb-3">Create Profile</h3>
                                <p className="text-text-medium max-w-xs">Build your professional tech profile or company dashboard in minutes.</p>
                            </div>
                            <div className="flex flex-col items-center reveal-item">
                                <div className="w-20 h-20 rounded-2xl bg-bg-gray border border-border-light flex items-center justify-center mb-6 shadow-md">
                                    <i data-lucide="zap" className="w-8 h-8 text-accent"></i>
                                </div>
                                <h3 className="text-xl font-bold text-text-dark mb-3">Smart Matching</h3>
                                <p className="text-text-medium max-w-xs">Our AI algorithms match talent with the most relevant opportunities.</p>
                            </div>
                            <div className="flex flex-col items-center reveal-item">
                                <div className="w-20 h-20 rounded-2xl bg-bg-gray border border-border-light flex items-center justify-center mb-6 shadow-md">
                                    <i data-lucide="award" className="w-8 h-8 text-primary"></i>
                                </div>
                                <h3 className="text-xl font-bold text-text-dark mb-3">Get Hired</h3>
                                <p className="text-text-medium max-w-xs">Interview directly with decision-makers and land your dream role.</p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* About Section */}
                <section className="py-24 px-4 bg-white border-b border-border-light reveal-up" id="about">
                    <div className="max-w-7xl mx-auto glass-card p-8 lg:p-12">
                        <div className="max-w-3xl">
                            <h2 className="text-4xl font-display font-bold text-text-dark mb-6">About the program</h2>
                            <div className="text-text-medium leading-relaxed space-y-6">
                                <p className="text-lg">
                                    The Ant-Tech Collaborator Program is designed for anyone who wants
                                    to earn additional income by connecting great talent with the
                                    right job opportunities. You don't need to be a professional
                                    recruiter – if you know talented people, you can become a
                                    collaborator with us.
                                </p>
                                <div className="pt-6 border-t border-border-light">
                                    <h3 className="text-2xl font-bold text-text-dark mb-4">Why join?</h3>
                                    <ul className="space-y-4">
                                        <li className="flex items-start gap-3">
                                            <i data-lucide="check-circle-2" className="w-6 h-6 text-primary flex-shrink-0 mt-0.5"></i>
                                            <span>Transparent and attractive commission for each successful placement</span>
                                        </li>
                                        <li className="flex items-start gap-3">
                                            <i data-lucide="check-circle-2" className="w-6 h-6 text-primary flex-shrink-0 mt-0.5"></i>
                                            <span>Work flexibly, anytime and anywhere</span>
                                        </li>
                                        <li className="flex items-start gap-3">
                                            <i data-lucide="check-circle-2" className="w-6 h-6 text-primary flex-shrink-0 mt-0.5"></i>
                                            <span>Access to training and continuous support from the Ant-Tech HR team</span>
                                        </li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Feature Grid */}
                <section className="py-24 px-4 bg-bg-light border-b border-border-light reveal-stagger" id="features">
                    <div className="max-w-7xl mx-auto">
                        <div className="text-center mb-16 reveal-item">
                            <h2 className="text-4xl font-display font-bold text-text-dark mb-4">Your Partner to Grow and Expand Anywhere</h2>
                            <p className="text-lg text-text-medium">Comprehensive solutions for your hiring and expansion needs.</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                            <div className="glass-card p-8 hover:-translate-y-2 transition-transform duration-300 reveal-item">
                                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-6">
                                    <i data-lucide="globe" className="w-6 h-6 text-primary"></i>
                                </div>
                                <h3 className="text-xl font-bold text-text-dark mb-3">Enter New Markets Fast</h3>
                                <p className="text-text-medium text-sm leading-relaxed">Operate without setting up a local entity — skip months of setup time.</p>
                            </div>

                            <div className="glass-card p-8 hover:-translate-y-2 transition-transform duration-300 reveal-item border-t-4 border-t-accent">
                                <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center mb-6">
                                    <i data-lucide="users" className="w-6 h-6 text-accent"></i>
                                </div>
                                <h3 className="text-xl font-bold text-text-dark mb-3">Hire Top Talent Anywhere</h3>
                                <p className="text-text-medium text-sm leading-relaxed">Leverage our headhunter network and talent database to find the right people.</p>
                            </div>

                            <div className="glass-card p-8 hover:-translate-y-2 transition-transform duration-300 reveal-item">
                                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-6">
                                    <i data-lucide="headset" className="w-6 h-6 text-primary"></i>
                                </div>
                                <h3 className="text-xl font-bold text-text-dark mb-3">All-in-One HR & Recruitment</h3>
                                <p className="text-text-medium text-sm leading-relaxed">From recruitment to admin and compliance — we handle it so you focus on growth.</p>
                            </div>

                            <div className="glass-card p-8 hover:-translate-y-2 transition-transform duration-300 reveal-item">
                                <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center mb-6">
                                    <i data-lucide="line-chart" className="w-6 h-6 text-accent"></i>
                                </div>
                                <h3 className="text-xl font-bold text-text-dark mb-3">Cost-Effective & Scalable</h3>
                                <p className="text-text-medium text-sm leading-relaxed">Scale quickly with competitive pricing, built for startups and high-growth teams.</p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* FAQ Section */}
                <section className="py-24 px-4 bg-bg-light border-y border-border-light reveal-up" id="faq">
                    <div className="max-w-4xl mx-auto">
                        <div className="text-center mb-16">
                            <h2 className="text-4xl font-display font-bold text-text-dark mb-4">Frequently Asked Questions</h2>
                            <p className="text-lg text-text-medium">Everything you need to know about the collaborator program.</p>
                        </div>

                        <div className="space-y-4">
                            {[
                                { q: "Who can join the collaborator program?", a: "Anyone with a network of professionals looking for job opportunities. No recruitment background is required." },
                                { q: "How do I earn commission?", a: "You earn commission for every candidate you refer who is successfully hired." },
                                { q: "When will I receive my payout?", a: "Commissions are paid according to company's payout schedule, where the company is the one who will pay the commission." }
                            ].map((item, i) => (
                                <div key={i} className="glass-card p-6">
                                    <button
                                        className="w-full flex justify-between items-center text-left"
                                        onClick={(e) => {
                                            const content = e.currentTarget.nextElementSibling;
                                            const icon = e.currentTarget.querySelector('i');
                                            content.classList.toggle('hidden');
                                            icon.classList.toggle('rotate-180');
                                        }}
                                    >
                                        <h3 className="text-xl font-bold text-text-dark">{item.q}</h3>
                                        <i data-lucide="chevron-down" className="w-5 h-5 text-text-medium transition-transform"></i>
                                    </button>
                                    <div className="hidden pt-4 mt-4 border-t border-border-light text-text-medium">
                                        {item.a}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Commission Section */}
                <section className="py-24 px-4 reveal-up">
                    <div className="max-w-7xl mx-auto glass-card bg-gradient-to-br from-primary/5 via-white to-accent/5 p-12 lg:p-20 text-center relative overflow-hidden">
                        <div
                            className="absolute top-0 left-0 w-full h-full opacity-5 pointer-events-none"
                            style={{ backgroundImage: "url('https://www.transparenttextures.com/patterns/carbon-fibre.png')" }}
                        ></div>
                        <div className="reveal-stagger">
                            <i data-lucide="trending-up" className="w-16 h-16 text-accent mx-auto mb-8 reveal-item"></i>
                            <h2 className="text-4xl lg:text-5xl font-display font-bold text-text-dark mb-6 reveal-item">Earn Commission for Every Success Referral</h2>
                            <p className="text-xl text-text-medium max-w-2xl mx-auto mb-10 reveal-item">
                                Join our exclusive network of tech headhunters. Refer top-tier developers and earn up to <span className="text-text-dark font-bold">$2,000 per successful hire</span>.
                            </p>
                            <div className="flex flex-wrap justify-center gap-6 reveal-item">
                                <div className="flex items-center gap-2 text-text-dark font-semibold"><i data-lucide="check-circle-2" className="text-primary w-5 h-5"></i> High Payouts</div>
                                <div className="flex items-center gap-2 text-text-dark font-semibold"><i data-lucide="check-circle-2" className="text-primary w-5 h-5"></i> Global Network</div>
                            </div>
                            <button onClick={() => window.location.href = '/login'} className="mt-12 btn-primary text-lg px-10 py-4 reveal-item">Start Referring Now</button>
                        </div>
                    </div>
                </section>

                {/* Blog Section */}
                <section className="py-24 px-4 reveal-stagger">
                    <div className="max-w-7xl mx-auto">
                        <div className="flex justify-between items-end mb-12 reveal-item">
                            <div>
                                <h2 className="text-3xl font-display font-bold text-text-dark mb-4">Insights & Resources</h2>
                                <p className="text-text-light">Stay updated with the latest in Asian tech recruitment.</p>
                            </div>
                            <button className="text-primary font-semibold hover:text-accent transition-colors">Read all articles</button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            {[
                                { title: "The Rise of Remote Tech Hubs in Southeast Asia", date: "Mar 12, 2025", tag: "Market Trends", img: "asia" },
                                { title: "How to Ace Your System Design Interview in 2025", date: "Mar 10, 2025", tag: "Career Advice", img: "interview" },
                                { title: "Why Companies are Moving from Java to Go", date: "Mar 08, 2025", tag: "Technology", img: "tech" }
                            ].map((blog, i) => (
                                <div key={i} className="group cursor-pointer reveal-item" onClick={() => window.location.href = '#'}>
                                    <div className="rounded-2xl overflow-hidden mb-6 aspect-video">
                                        <img src={`https://picsum.photos/seed/${blog.img}/600/400`} alt={blog.tag} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                    </div>
                                    <span className="text-xs font-bold text-primary uppercase tracking-widest mb-3 block">{blog.tag}</span>
                                    <h3 className="text-xl font-bold text-text-dark mb-3 group-hover:text-primary transition-colors leading-tight">
                                        {blog.title}
                                    </h3>
                                    <p className="text-text-light text-sm">{blog.date}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            </main>

            {/* Footer */}
            <footer className="pt-24 pb-12 px-4 border-t border-border-light bg-bg-gray">
                <div className="max-w-7xl mx-auto">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
                        <div>
                            <div className="flex items-center gap-2 mb-6">
                                <div className="w-8 h-8 bg-gradient-to-br from-accent to-primary rounded flex items-center justify-center">
                                    <i data-lucide="zap" className="text-white w-5 h-5 fill-current"></i>
                                </div>
                                <span className="text-xl font-display font-bold text-text-dark">AntTech Asia</span>
                            </div>
                            <p className="text-text-light text-sm leading-relaxed mb-6">
                                The premier tech recruitment platform connecting top talent with high-growth companies across Asia.
                            </p>
                            <div className="flex gap-4">
                                <a href="" className="w-8 h-8 rounded-full bg-white border border-border-light flex items-center justify-center text-text-light hover:bg-primary hover:text-white transition-all">
                                    <i data-lucide="twitter" className="w-4 h-4"></i>
                                </a>
                                <a href="" className="w-8 h-8 rounded-full bg-white border border-border-light flex items-center justify-center text-text-light hover:bg-primary hover:text-white transition-all">
                                    <i data-lucide="linkedin" className="w-4 h-4"></i>
                                </a>
                                <a href="https://m.me/anttechasia" className="w-8 h-8 rounded-full bg-white border border-border-light flex items-center justify-center text-text-light hover:bg-primary hover:text-white transition-all">
                                    <i data-lucide="facebook" className="w-4 h-4"></i>
                                </a>
                                <a href="https://t.me/anttechasia" className="w-8 h-8 rounded-full bg-white border border-border-light flex items-center justify-center text-text-light hover:bg-primary hover:text-white transition-all">
                                    <i data-lucide="send" className="w-4 h-4"></i>
                                </a>
                            </div>
                        </div>

                        <div>
                            <h4 className="text-text-dark font-bold mb-6">For Candidates</h4>
                            <ul className="space-y-4 text-sm text-text-light">
                                <li><a href="/login" className="hover:text-primary transition-colors">Browse Jobs</a></li>
                                <li><a href="" className="hover:text-primary transition-colors">Career Advice</a></li>
                                <li><a href="" className="hover:text-primary transition-colors">Salary Insights</a></li>
                            </ul>
                        </div>

                        <div>
                            <h4 className="text-text-dark font-bold mb-6">For Employers</h4>
                            <ul className="space-y-4 text-sm text-text-light">
                                <li><a href="/login" className="hover:text-primary transition-colors">Post a Job</a></li>
                                <li><a href="" className="hover:text-primary transition-colors">Hiring Solutions</a></li>
                                <li><a href="" className="hover:text-primary transition-colors">Pricing</a></li>
                            </ul>
                        </div>

                        <div>
                            <h4 className="text-text-dark font-bold mb-6">Company</h4>
                            <ul className="space-y-4 text-sm text-text-light">
                                <li><a href="" className="hover:text-primary transition-colors">About Us</a></li>
                                <li><a href="" className="hover:text-primary transition-colors">Contact</a></li>
                                <li><a href="/terms" className="hover:text-primary transition-colors">Privacy Policy</a></li>
                            </ul>
                        </div>
                    </div>

                    <div className="pt-8 border-t border-border-light flex flex-col md:flex-row justify-between items-center gap-4">
                        <p className="text-text-light text-xs">© 2026 AntTech Asia. All rights reserved.</p>
                        <div className="flex items-center gap-6 text-xs text-text-light">
                            <a href="" className="hover:text-text-dark">English (US)</a>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
}