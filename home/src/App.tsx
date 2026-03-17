import React, { useState } from 'react';
import { 
  Search, 
  MapPin, 
  Briefcase, 
  DollarSign, 
  Users, 
  Building2, 
  ArrowRight, 
  CheckCircle2, 
  TrendingUp, 
  Globe, 
  Menu, 
  X,
  ChevronRight,
  Star,
  Zap,
  Award
} from 'lucide-react';
import { motion } from 'motion/react';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-border-light">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-to-br from-accent to-primary rounded-lg flex items-center justify-center">
              <Zap className="text-white w-6 h-6 fill-current" />
            </div>
            <span className="text-2xl font-display font-bold text-text-dark tracking-tight">AntTech<span className="text-primary">Asia</span></span>
          </div>
          
          <div className="hidden md:flex items-center gap-8">
            <a href="#" className="text-sm font-medium text-text-medium hover:text-primary transition-colors">Find Jobs</a>
            <a href="#" className="text-sm font-medium text-text-medium hover:text-primary transition-colors">For Companies</a>
            <a href="#" className="text-sm font-medium text-text-medium hover:text-primary transition-colors">Headhunters</a>
            <a href="#" className="text-sm font-medium text-text-medium hover:text-primary transition-colors">Resources</a>
          </div>

          <div className="hidden md:flex items-center gap-4">
            <button className="text-sm font-medium text-text-dark hover:text-primary transition-colors">Log in</button>
            <button className="btn-primary py-2 px-5">Join Now</button>
          </div>

          <div className="md:hidden">
            <button onClick={() => setIsOpen(!isOpen)} className="text-text-medium">
              {isOpen ? <X /> : <Menu />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isOpen && (
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="md:hidden bg-white border-b border-border-light px-4 pt-2 pb-6 space-y-1"
        >
          <a href="#" className="block px-3 py-4 text-base font-medium text-text-medium">Find Jobs</a>
          <a href="#" className="block px-3 py-4 text-base font-medium text-text-medium">For Companies</a>
          <a href="#" className="block px-3 py-4 text-base font-medium text-text-medium">Headhunters</a>
          <a href="#" className="block px-3 py-4 text-base font-medium text-text-medium">Resources</a>
          <div className="pt-4 flex flex-col gap-3">
            <button className="w-full btn-secondary">Log in</button>
            <button className="w-full btn-primary">Join Now</button>
          </div>
        </motion.div>
      )}
    </nav>
  );
};

const Hero = () => {
  return (
    <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden bg-bg-light">
      {/* Background Blobs */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full -z-10">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-primary/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-accent/10 blur-[120px] rounded-full" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <span className="inline-block py-1 px-3 rounded-full bg-primary/5 border border-primary/10 text-primary text-xs font-bold uppercase tracking-wider mb-6">
            The Future of Tech Hiring in Asia
          </span>
          <h1 className="text-5xl lg:text-7xl font-display font-bold text-text-dark mb-8 leading-[1.1]">
            Connect with the <span className="text-gradient">Top 1%</span> <br />
            Tech Talent in Asia
          </h1>
          <p className="text-lg lg:text-xl text-text-medium max-w-2xl mx-auto mb-10 leading-relaxed">
            AntTech Asia is the premier recruitment platform for high-growth startups and tech giants looking to scale their engineering teams across the continent.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button className="w-full sm:w-auto btn-primary text-lg px-8 py-4 flex items-center justify-center gap-2">
              Find Your Next Role <ArrowRight className="w-5 h-5" />
            </button>
            <button className="w-full sm:w-auto btn-secondary text-lg px-8 py-4">
              Hire Top Talent
            </button>
          </div>
        </motion.div>

        {/* Stats */}
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="mt-20 grid grid-cols-2 lg:grid-cols-4 gap-8 max-w-4xl mx-auto"
        >
          {[
            { label: 'Active Jobs', value: '2,500+' },
            { label: 'Top Engineers', value: '50k+' },
            { label: 'Partner Companies', value: '800+' },
            { label: 'Avg. Salary Hike', value: '35%' },
          ].map((stat, i) => (
            <div key={i} className="text-center">
              <div className="text-3xl font-bold text-text-dark mb-1">{stat.value}</div>
              <div className="text-sm text-text-light font-medium uppercase tracking-wide">{stat.label}</div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

const SearchBar = () => {
  return (
    <section className="relative z-10 -mt-10 px-4">
      <div className="max-w-5xl mx-auto glass-card p-4 lg:p-6 flex flex-col lg:flex-row gap-4 items-center">
        <div className="flex-1 w-full relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-light w-5 h-5" />
          <input 
            type="text" 
            placeholder="Job title, keywords, or company" 
            className="w-full bg-bg-gray border border-border-light rounded-xl py-3 pl-12 pr-4 text-text-dark focus:outline-none focus:border-primary/50 transition-colors"
          />
        </div>
        <div className="flex-1 w-full relative">
          <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-text-light w-5 h-5" />
          <select className="w-full bg-bg-gray border border-border-light rounded-xl py-3 pl-12 pr-4 text-text-dark focus:outline-none focus:border-primary/50 transition-colors appearance-none">
            <option>All Locations</option>
            <option>Singapore</option>
            <option>Vietnam</option>
            <option>Thailand</option>
            <option>Indonesia</option>
            <option>Remote</option>
          </select>
        </div>
        <button className="w-full lg:w-auto btn-primary py-3 px-10 whitespace-nowrap">
          Search Jobs
        </button>
      </div>
    </section>
  );
};

const FeaturedJobs = () => {
  const jobs = [
    {
      title: 'Senior Full Stack Engineer',
      company: 'Grab',
      logo: 'https://picsum.photos/seed/grab/100/100',
      location: 'Singapore (Remote)',
      salary: '$6k - $10k',
      tags: ['React', 'Node.js', 'Go'],
      type: 'Full-time'
    },
    {
      title: 'Product Designer (UX/UI)',
      company: 'VNG Corporation',
      logo: 'https://picsum.photos/seed/vng/100/100',
      location: 'Ho Chi Minh City',
      salary: '$3k - $5k',
      tags: ['Figma', 'Prototyping', 'User Research'],
      type: 'Full-time'
    },
    {
      title: 'Backend Engineer (Distributed Systems)',
      company: 'Sea Group',
      logo: 'https://picsum.photos/seed/sea/100/100',
      location: 'Jakarta (Hybrid)',
      salary: '$5k - $8k',
      tags: ['Java', 'Microservices', 'K8s'],
      type: 'Full-time'
    },
    {
      title: 'AI/ML Research Scientist',
      company: 'Ant Group',
      logo: 'https://picsum.photos/seed/ant/100/100',
      location: 'Bangkok',
      salary: '$7k - $12k',
      tags: ['Python', 'PyTorch', 'NLP'],
      type: 'Full-time'
    },
    {
      title: 'DevOps Engineer',
      company: 'Gojek',
      logo: 'https://picsum.photos/seed/gojek/100/100',
      location: 'Remote',
      salary: '$4k - $7k',
      tags: ['AWS', 'Terraform', 'CI/CD'],
      type: 'Contract'
    },
    {
      title: 'Mobile Engineer (Flutter)',
      company: 'Traveloka',
      logo: 'https://picsum.photos/seed/traveloka/100/100',
      location: 'Jakarta',
      salary: '$3.5k - $6k',
      tags: ['Flutter', 'Dart', 'Firebase'],
      type: 'Full-time'
    }
  ];

  return (
    <section className="py-24 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-end mb-12">
          <div>
            <h2 className="text-3xl font-display font-bold text-text-dark mb-4">Featured Opportunities</h2>
            <p className="text-text-light">Hand-picked roles from top tech companies in Asia.</p>
          </div>
          <button className="hidden sm:flex items-center gap-2 text-primary font-semibold hover:text-accent transition-colors">
            View all jobs <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {jobs.map((job, i) => (
            <motion.div 
              key={i}
              whileHover={{ y: -5 }}
              className="glass-card p-6 hover:border-primary/30 transition-all cursor-pointer group"
            >
              <div className="flex justify-between items-start mb-6">
                <div className="w-12 h-12 rounded-xl overflow-hidden bg-bg-gray">
                  <img src={job.logo} alt={job.company} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                </div>
                <span className="px-3 py-1 rounded-full bg-bg-gray text-xs font-medium text-text-light border border-border-light">
                  {job.type}
                </span>
              </div>
              <h3 className="text-xl font-bold text-text-dark mb-2 group-hover:text-primary transition-colors">{job.title}</h3>
              <p className="text-text-light text-sm mb-4 flex items-center gap-1">
                <Building2 className="w-4 h-4" /> {job.company} • <MapPin className="w-4 h-4" /> {job.location}
              </p>
              <div className="flex flex-wrap gap-2 mb-6">
                {job.tags.map((tag, j) => (
                  <span key={j} className="px-2 py-1 rounded-md bg-primary/5 text-[10px] font-bold text-primary uppercase tracking-wider border border-primary/10">
                    {tag}
                  </span>
                ))}
              </div>
              <div className="pt-4 border-t border-border-light flex justify-between items-center">
                <span className="text-text-dark font-bold">{job.salary}</span>
                <button className="text-sm font-semibold text-text-medium group-hover:text-primary flex items-center gap-1">
                  Apply Now <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

const SplitSection = () => {
  return (
    <section className="py-24 bg-bg-light border-y border-border-light px-4">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* For Companies */}
        <div className="glass-card p-10 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 blur-3xl -mr-16 -mt-16 group-hover:bg-primary/10 transition-all" />
          <Building2 className="w-12 h-12 text-primary mb-6" />
          <h2 className="text-3xl font-display font-bold text-text-dark mb-4">For Companies</h2>
          <p className="text-text-medium mb-8 leading-relaxed">
            Scale your engineering team with pre-vetted tech talent. Our platform uses AI to match you with candidates who fit your technical requirements and culture.
          </p>
          <ul className="space-y-4 mb-10">
            {[
              'Access to top 1% tech talent in Asia',
              'AI-powered candidate matching',
              'Dedicated account manager',
              'Streamlined interview scheduling'
            ].map((item, i) => (
              <li key={i} className="flex items-center gap-3 text-text-medium">
                <CheckCircle2 className="w-5 h-5 text-accent" /> {item}
              </li>
            ))}
          </ul>
          <button className="btn-primary w-full sm:w-auto">Start Hiring</button>
        </div>

        {/* For Headhunters */}
        <div className="glass-card p-10 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-accent/5 blur-3xl -mr-16 -mt-16 group-hover:bg-accent/10 transition-all" />
          <Users className="w-12 h-12 text-accent mb-6" />
          <h2 className="text-3xl font-display font-bold text-text-dark mb-4">For Headhunters</h2>
          <p className="text-text-medium mb-8 leading-relaxed">
            Monetize your network. Refer top candidates to our exclusive job openings and earn industry-leading commissions on every successful placement.
          </p>
          <ul className="space-y-4 mb-10">
            {[
              'Earn up to 20% commission per hire',
              'Access to exclusive high-paying roles',
              'Real-time referral tracking dashboard',
              'Fast payouts and transparent process'
            ].map((item, i) => (
              <li key={i} className="flex items-center gap-3 text-text-medium">
                <CheckCircle2 className="w-5 h-5 text-primary" /> {item}
              </li>
            ))}
          </ul>
          <button className="btn-secondary w-full sm:w-auto border-accent/20 hover:bg-accent/5">Become a Partner</button>
        </div>
      </div>
    </section>
  );
};

const HowItWorks = () => {
  const steps = [
    {
      icon: <Users className="w-8 h-8 text-primary" />,
      title: 'Create Profile',
      desc: 'Build your professional tech profile or company dashboard in minutes.'
    },
    {
      icon: <Zap className="w-8 h-8 text-accent" />,
      title: 'Smart Matching',
      desc: 'Our AI algorithms match talent with the most relevant opportunities.'
    },
    {
      icon: <Award className="w-8 h-8 text-primary" />,
      title: 'Get Hired',
      desc: 'Interview directly with decision-makers and land your dream role.'
    }
  ];

  return (
    <section className="py-24 px-4">
      <div className="max-w-7xl mx-auto text-center">
        <h2 className="text-4xl font-display font-bold text-text-dark mb-16">How It Works</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative">
          {/* Connector lines for desktop */}
          <div className="hidden md:block absolute top-1/2 left-1/4 right-1/4 h-0.5 bg-gradient-to-r from-primary/10 via-accent/10 to-primary/10 -translate-y-12 -z-10" />
          
          {steps.map((step, i) => (
            <div key={i} className="flex flex-col items-center">
              <div className="w-20 h-20 rounded-2xl bg-bg-gray border border-border-light flex items-center justify-center mb-6 shadow-md">
                {step.icon}
              </div>
              <h3 className="text-xl font-bold text-text-dark mb-3">{step.title}</h3>
              <p className="text-text-medium max-w-xs">{step.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

const Testimonials = () => {
  const logos = [
    'Grab', 'Sea', 'Gojek', 'Traveloka', 'VNG', 'AntGroup'
  ];

  return (
    <section className="py-24 px-4 bg-bg-light">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <p className="text-text-light font-semibold uppercase tracking-widest mb-8">Trusted by industry leaders</p>
          <div className="flex flex-wrap justify-center items-center gap-12 opacity-40 grayscale hover:grayscale-0 transition-all duration-500">
            {logos.map((logo, i) => (
              <span key={i} className="text-2xl font-display font-bold text-text-dark">{logo}</span>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {[
            {
              text: "AntTech Asia helped us find a Lead Architect in less than 2 weeks. The quality of candidates is significantly higher than other platforms we've used.",
              author: "Sarah Chen",
              role: "Head of Engineering at Grab",
              avatar: "https://picsum.photos/seed/sarah/100/100"
            },
            {
              text: "As a headhunter, the commission structure and transparency on AntTech are unmatched. It's become my primary source for high-level tech placements.",
              author: "David Nguyen",
              role: "Senior Tech Recruiter",
              avatar: "https://picsum.photos/seed/david/100/100"
            }
          ].map((t, i) => (
            <div key={i} className="glass-card p-8">
              <div className="flex gap-1 mb-6">
                {[...Array(5)].map((_, j) => <Star key={j} className="w-4 h-4 text-accent fill-current" />)}
              </div>
              <p className="text-lg text-text-medium italic mb-8 leading-relaxed">"{t.text}"</p>
              <div className="flex items-center gap-4">
                <img src={t.avatar} alt={t.author} className="w-12 h-12 rounded-full object-cover" referrerPolicy="no-referrer" />
                <div>
                  <div className="text-text-dark font-bold">{t.author}</div>
                  <div className="text-text-light text-sm">{t.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

const CommissionSection = () => {
  return (
    <section className="py-24 px-4">
      <div className="max-w-7xl mx-auto glass-card bg-gradient-to-br from-primary/5 via-white to-accent/5 p-12 lg:p-20 text-center relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-5 pointer-events-none" />
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
        >
          <TrendingUp className="w-16 h-16 text-accent mx-auto mb-8" />
          <h2 className="text-4xl lg:text-5xl font-display font-bold text-text-dark mb-6">Earn Commission for Every Referral</h2>
          <p className="text-xl text-text-medium max-w-2xl mx-auto mb-10">
            Join our exclusive network of tech headhunters. Refer top-tier developers and earn up to <span className="text-text-dark font-bold">$2,000 per successful hire</span>.
          </p>
          <div className="flex flex-wrap justify-center gap-6">
            <div className="flex items-center gap-2 text-text-dark font-semibold">
              <CheckCircle2 className="text-primary" /> High Payouts
            </div>
            <div className="flex items-center gap-2 text-text-dark font-semibold">
              <CheckCircle2 className="text-primary" /> Real-time Tracking
            </div>
            <div className="flex items-center gap-2 text-text-dark font-semibold">
              <CheckCircle2 className="text-primary" /> Global Network
            </div>
          </div>
          <button className="mt-12 btn-primary text-lg px-10 py-4">Start Referring Now</button>
        </motion.div>
      </div>
    </section>
  );
};

const BlogSection = () => {
  const posts = [
    {
      title: 'The Rise of Remote Tech Hubs in Southeast Asia',
      category: 'Market Trends',
      image: 'https://picsum.photos/seed/asia/600/400',
      date: 'Mar 12, 2024'
    },
    {
      title: 'How to Ace Your System Design Interview in 2024',
      category: 'Career Advice',
      image: 'https://picsum.photos/seed/interview/600/400',
      date: 'Mar 10, 2024'
    },
    {
      title: 'Why Companies are Moving from Java to Go',
      category: 'Technology',
      image: 'https://picsum.photos/seed/tech/600/400',
      date: 'Mar 08, 2024'
    }
  ];

  return (
    <section className="py-24 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-end mb-12">
          <div>
            <h2 className="text-3xl font-display font-bold text-text-dark mb-4">Insights & Resources</h2>
            <p className="text-text-light">Stay updated with the latest in Asian tech recruitment.</p>
          </div>
          <button className="text-primary font-semibold hover:text-accent transition-colors">Read all articles</button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {posts.map((post, i) => (
            <motion.div key={i} whileHover={{ y: -5 }} className="group cursor-pointer">
              <div className="rounded-2xl overflow-hidden mb-6 aspect-video">
                <img src={post.image} alt={post.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" referrerPolicy="no-referrer" />
              </div>
              <span className="text-xs font-bold text-primary uppercase tracking-widest mb-3 block">{post.category}</span>
              <h3 className="text-xl font-bold text-text-dark mb-3 group-hover:text-primary transition-colors leading-tight">{post.title}</h3>
              <p className="text-text-light text-sm">{post.date}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

const Footer = () => {
  return (
    <footer className="pt-24 pb-12 px-4 border-t border-border-light bg-bg-gray">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
          <div>
            <div className="flex items-center gap-2 mb-6">
              <div className="w-8 h-8 bg-gradient-to-br from-accent to-primary rounded flex items-center justify-center">
                <Zap className="text-white w-5 h-5 fill-current" />
              </div>
              <span className="text-xl font-display font-bold text-text-dark">AntTech Asia</span>
            </div>
            <p className="text-text-light text-sm leading-relaxed mb-6">
              The premier tech recruitment platform connecting top talent with high-growth companies across Asia.
            </p>
            <div className="flex gap-4">
              {['Twitter', 'LinkedIn', 'Facebook', 'Instagram'].map((s, i) => (
                <a key={i} href="#" className="w-8 h-8 rounded-full bg-white border border-border-light flex items-center justify-center text-text-light hover:bg-primary hover:text-white transition-all">
                  <Globe className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-text-dark font-bold mb-6">For Candidates</h4>
            <ul className="space-y-4 text-sm text-text-light">
              <li><a href="#" className="hover:text-primary transition-colors">Browse Jobs</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Career Advice</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Salary Insights</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Resume Builder</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-text-dark font-bold mb-6">For Employers</h4>
            <ul className="space-y-4 text-sm text-text-light">
              <li><a href="#" className="hover:text-primary transition-colors">Post a Job</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Hiring Solutions</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Pricing</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Success Stories</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-text-dark font-bold mb-6">Company</h4>
            <ul className="space-y-4 text-sm text-text-light">
              <li><a href="#" className="hover:text-primary transition-colors">About Us</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Contact</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Terms of Service</a></li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-border-light flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-text-light text-xs">© 2024 AntTech Asia. All rights reserved.</p>
          <div className="flex items-center gap-6 text-xs text-text-light">
            <a href="#" className="hover:text-text-dark">English (US)</a>
            <a href="#" className="hover:text-text-dark">Tiếng Việt</a>
            <a href="#" className="hover:text-text-dark">ภาษาไทย</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default function App() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <main>
        <Hero />
        <SearchBar />
        <FeaturedJobs />
        <SplitSection />
        <HowItWorks />
        <Testimonials />
        <CommissionSection />
        <BlogSection />
      </main>
      <Footer />
    </div>
  );
}
