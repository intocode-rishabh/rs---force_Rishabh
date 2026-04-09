require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');
const User     = require('../models/User');
const Post     = require('../models/Post');
const Review   = require('../models/Review');

const MONGO_URI = process.env.MONGO_URI;

const dummyProviders = [
  // PLUMBERS
  { name: 'Rajesh Kumar',   profession: 'Plumber',        location: 'Gomti Nagar, Lucknow',  hourlyRate: 350, about: 'Expert plumber with 8+ years of experience in residential and commercial plumbing. Specialise in leak repair, pipe fitting, and bathroom installations.', contacts: { whatsapp: '+919876543210', instagram: null, twitter: null } },
  { name: 'Manoj Verma',    profession: 'Plumber',        location: 'Hazratganj, Lucknow',   hourlyRate: 300, about: 'Reliable and affordable plumbing services. 5 years experience. Available 24/7 for emergency repairs.', contacts: { whatsapp: '+919812345678', instagram: null, twitter: null } },
  { name: 'Sunil Sharma',   profession: 'Plumber',        location: 'Aliganj, Lucknow',      hourlyRate: 400, about: 'Licensed plumber specialising in modern bathroom fittings, water heaters, and pipeline maintenance.', contacts: { whatsapp: null, instagram: 'sunil_plumber', twitter: null } },
  { name: 'Deepak Yadav',   profession: 'Plumber',        location: 'Indira Nagar, Lucknow', hourlyRate: 280, about: 'Quick, clean, and professional plumbing at your doorstep. All tools included.', contacts: { whatsapp: '+918799123456', instagram: null, twitter: null } },
  { name: 'Ravi Tiwari',    profession: 'Plumber',        location: 'Chinhat, Lucknow',      hourlyRate: 320, about: 'Trusted plumber serving Lucknow for over 10 years. Specialise in drainage, borewell, and overhead tank repair.', contacts: { whatsapp: '+919923456781', instagram: null, twitter: null } },

  // TUTORS
  { name: 'Priya Sharma',   profession: 'Tutor',          location: 'Hazratganj, Lucknow',   hourlyRate: 500, about: 'IIT-JEE cleared. Teaching Maths & Physics for Class 9–12. 95% success rate. Online and offline sessions available.', contacts: { whatsapp: '+919988776655', instagram: 'priya.teaches', twitter: null } },
  { name: 'Ankit Gupta',    profession: 'Tutor',          location: 'Gomti Nagar, Lucknow',  hourlyRate: 600, about: 'CA qualified. Expert in Accountancy, Economics, and Business Studies for Class 11–12 and Commerce entrance exams.', contacts: { whatsapp: '+919871234560', instagram: null, twitter: 'ankitgupta_edu' } },
  { name: 'Sneha Mishra',   profession: 'Tutor',          location: 'Aliganj, Lucknow',      hourlyRate: 450, about: 'MA English Literature. Teaching English Grammar, Essay writing, and Literature for all boards from Class 6 to 12.', contacts: { whatsapp: '+918765432190', instagram: 'sneha_engtutor', twitter: null } },
  { name: 'Rahul Singh',    profession: 'Tutor',          location: 'Indira Nagar, Lucknow', hourlyRate: 700, about: 'B.Tech CSE. Coding tutor for Python, C++, Java. Teach kids from age 10 and college students. Placement prep specialist.', contacts: { whatsapp: '+919754321089', instagram: null, twitter: 'rahul_codetutor' } },
  { name: 'Kavya Pandey',   profession: 'Tutor',          location: 'Mahanagar, Lucknow',    hourlyRate: 400, about: 'Home tutor for primary classes (1–5). All subjects, CBSE & ICSE. Patient, nurturing teaching style. 7 yrs experience.', contacts: { whatsapp: '+919643210987', instagram: 'kavya_hometutor', twitter: null } },

  // ELECTRICIANS
  { name: 'Amit Singh',     profession: 'Electrician',    location: 'Aliganj, Lucknow',      hourlyRate: 400, about: 'Certified electrician with 6+ years of experience. Specialise in home wiring, fan installation, MCB panel work, and inverter setup.', contacts: { whatsapp: '+919532109876', instagram: null, twitter: null } },
  { name: 'Vijay Kumar',    profession: 'Electrician',    location: 'Charbagh, Lucknow',     hourlyRate: 350, about: 'Licensed electrical contractor. Handle residential, commercial, and industrial projects. 24/7 emergency service available.', contacts: { whatsapp: '+919421098765', instagram: 'vijay_electric', twitter: null } },
  { name: 'Pradeep Mishra', profession: 'Electrician',    location: 'Gomti Nagar, Lucknow',  hourlyRate: 450, about: 'Expert in solar panel installation, EV charger setup, and smart home automation. 8 years in the field.', contacts: { whatsapp: '+919310987654', instagram: null, twitter: 'pradeep_solar' } },
  { name: 'Arvind Rao',     profession: 'Electrician',    location: 'Hazratganj, Lucknow',   hourlyRate: 300, about: 'Affordable and reliable electrical repairs. Specialise in short-circuit fixing, wiring, switchboard installation.', contacts: { whatsapp: '+919209876543', instagram: null, twitter: null } },
  { name: 'Ganesh Patel',   profession: 'Electrician',    location: 'Indira Nagar, Lucknow', hourlyRate: 380, about: 'Professional electrician for new construction and renovation projects. Adherent to safety standards and building codes.', contacts: { whatsapp: '+919198765432', instagram: 'ganesh_electric', twitter: null } },

  // DELIVERY AGENTS
  { name: 'Suresh Patel',   profession: 'Delivery Agent', location: 'Hazratganj, Lucknow',   hourlyRate: 200, about: 'Same-day delivery specialist. Cover entire Lucknow city. Own bike. Handle documents, parcels, food orders, and medicine delivery.', contacts: { whatsapp: '+919087654321', instagram: null, twitter: null } },
  { name: 'Raju Yadav',     profession: 'Delivery Agent', location: 'Aliganj, Lucknow',      hourlyRate: 180, about: 'Reliable courier and delivery service. Two-wheeler available. Fast, safe, and affordable deliveries across Lucknow.', contacts: { whatsapp: '+918976543210', instagram: null, twitter: null } },
  { name: 'Mohan Lal',      profession: 'Delivery Agent', location: 'Gomti Nagar, Lucknow',  hourlyRate: 220, about: 'Professional delivery agent with 3 years experience. GPS tracked routes. Handle fragile items with care.', contacts: { whatsapp: '+918865432109', instagram: 'mohan_delivers', twitter: null } },
  { name: 'Shyam Gupta',    profession: 'Delivery Agent', location: 'Chinhat, Lucknow',      hourlyRate: 190, about: 'Quick delivery services for local shops and individuals. Night delivery available. No delivery too small.', contacts: { whatsapp: '+918754321098', instagram: null, twitter: null } },
  { name: 'Arun Srivastava',profession: 'Delivery Agent', location: 'Mahanagar, Lucknow',    hourlyRate: 250, about: 'Premium delivery service. Specialise in e-commerce returns, document dispatch, and corporate courier needs.', contacts: { whatsapp: null, instagram: 'arun_courier', twitter: 'arun_delivers' } },

  // DOCTORS
  { name: 'Dr. Neha Agarwal',  profession: 'Doctor',     location: 'Gomti Nagar, Lucknow',  hourlyRate: 800, about: 'MBBS, MD (General Medicine). 10+ years clinical experience. Home visit available. Specialise in fever, diabetes, BP management, and general checkups.', contacts: { whatsapp: '+918643210987', instagram: null, twitter: null } },
  { name: 'Dr. Sanjay Mehta',  profession: 'Doctor',     location: 'Hazratganj, Lucknow',   hourlyRate: 900, about: 'Paediatrician with 12 years experience. MBBS, MD (Paediatrics). Home consultations for children. Vaccination guidance and child nutrition.', contacts: { whatsapp: '+918532109876', instagram: null, twitter: 'drsanjaypeds' } },
  { name: 'Dr. Anjali Verma',  profession: 'Doctor',     location: 'Aliganj, Lucknow',      hourlyRate: 700, about: 'Homeopathic physician with 8 years of practice. Specialise in skin, thyroid, and chronic disease management through natural remedies.', contacts: { whatsapp: '+918421098765', instagram: 'dr_anjali_homeo', twitter: null } },
  { name: 'Dr. Rohit Sinha',   profession: 'Doctor',     location: 'Indira Nagar, Lucknow', hourlyRate: 1000, about: 'Orthopaedic specialist. MBBS, MS (Ortho). Home visit for elderly patients. Joint pain, slip disc, and physiotherapy consultations.', contacts: { whatsapp: '+918310987654', instagram: null, twitter: null } },
  { name: 'Dr. Pooja Tiwari',  profession: 'Doctor',     location: 'Mahanagar, Lucknow',    hourlyRate: 750, about: 'Gynaecologist and womens health consultant. MBBS, MD. Prenatal care, menstrual health, and PCOD management. Tele and home consultation available.', contacts: { whatsapp: '+918209876543', instagram: 'dr_pooja_womens', twitter: null } },

  // OTHERS
  { name: 'Karan Malhotra',    profession: 'Others',     location: 'Gomti Nagar, Lucknow',  hourlyRate: 400, about: 'Professional home cleaning, pest control, and laundry service. Trained staff, eco-friendly products, and guaranteed results.', contacts: { whatsapp: '+918198765432', instagram: 'karan_cleanpro', twitter: null } },
  { name: 'Sita Devi',         profession: 'Others',     location: 'Chinhat, Lucknow',      hourlyRate: 300, about: 'Experienced cook and catering assistant. Specialise in North Indian home-style cooking for events, parties, and daily meal prep.', contacts: { whatsapp: '+918087654321', instagram: null, twitter: null } },
  { name: 'Tarun Bajaj',       profession: 'Others',     location: 'Hazratganj, Lucknow',   hourlyRate: 500, about: 'Professional carpenter and furniture repair expert. 10 years experience. Handle custom wood work, sofa repair, modular furniture assembly.', contacts: { whatsapp: null, instagram: 'tarun_carpentry', twitter: null } },
  { name: 'Meena Trivedi',     profession: 'Others',     location: 'Aliganj, Lucknow',      hourlyRate: 350, about: 'Professional beautician offering home visits for bridal makeup, threading, facial, and hair spa. 6 years in beauty industry.', contacts: { whatsapp: '+917976543210', instagram: 'meena_beauty', twitter: null } },
  { name: 'Ajay Chauhan',      profession: 'Others',     location: 'Indira Nagar, Lucknow', hourlyRate: 450, about: 'AC technician and appliance repair specialist. Fix washing machines, refrigerators, AC, and all major home appliances. Prompt service.', contacts: { whatsapp: '+917865432109', instagram: null, twitter: null } },
];

const dummyPosts = [
  { profession: 'Plumber',        description: 'My kitchen sink is blocked and water is backing up. Need an experienced plumber urgently today. Located in Gomti Nagar.', userName: 'Reena Agarwal' },
  { profession: 'Plumber',        description: 'Looking for a reliable plumber to fix a leaking bathroom pipe. Please bring your own tools. Flexible timing, Indira Nagar.', userName: 'Sudhir Pandey' },
  { profession: 'Tutor',          description: 'Need a home tutor for my Class 10 daughter for Maths and Science. CBSE board. 2 hours daily in the evening, Aliganj.', userName: 'Geeta Sharma' },
  { profession: 'Tutor',          description: 'Looking for Python programming tutor for my college-going son. Beginner level. Gomti Nagar. Weekend sessions preferred.', userName: 'Vinod Mishra' },
  { profession: 'Electrician',    description: 'New house wiring needed for 3BHK flat in Hazratganj. Should have experience with modular switches and MCB panel installation.', userName: 'Sunita Rao' },
  { profession: 'Electrician',    description: 'Short circuit issue in my office. Need an electrician immediately. Located in Mahanagar, Lucknow. Urgent!', userName: 'Pankaj Srivastava' },
  { profession: 'Delivery Agent', description: 'Need daily tiffin delivery from my home to my office in Charbagh. Mon-Sat, 2 tiffins. Looking for someone reliable.', userName: 'Aman Kapoor' },
  { profession: 'Delivery Agent', description: 'Need courier pickup from Chinhat to Hazratganj. Documents to be delivered safely and quickly. Today if possible.', userName: 'Nalini Joshi' },
  { profession: 'Doctor',         description: 'Looking for a general physician for home visit. Elderly patient (75 yrs), having fever and cough since 2 days. Indira Nagar.', userName: 'Rakesh Bansal' },
  { profession: 'Doctor',         description: 'Need paediatrician for home visit for my 4-year-old with cold and mild fever. Gomti Nagar. Please reach out ASAP.', userName: 'Priti Khanna' },
  { profession: 'Others',         description: 'Looking for a professional cook for a small family gathering of 20 people this Sunday. North Indian food. Aliganj.', userName: 'Ritu Gupta' },
  { profession: 'Others',         description: 'Need AC servicing done for 2 ACs before summer. Experienced technician preferred. Hazratganj. Available on weekdays.', userName: 'Manoj Chandra' },
];

async function seed() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Remove old dummy data
    await User.deleteMany({ isDummy: true });
    await Post.deleteMany({ isDummy: true });
    await Review.deleteMany({ isDummy: true });
    console.log('🧹 Cleared old dummy data');

    const password = await bcrypt.hash('dummy_not_real_123', 12);

    const createdUsers = [];
    for (const p of dummyProviders) {
      const emailSlug = p.name.toLowerCase().replace(/[^a-z]/g, '').slice(0, 10);
      const user = await User.create({
        name:            p.name,
        email:           `${emailSlug}@demo.neighbourhub.in`,
        password,
        role:            'provider',
        profession:      p.profession,
        username:        emailSlug + Math.floor(Math.random() * 999),
        about:           p.about,
        location:        p.location,
        hourlyRate:      p.hourlyRate,
        contacts:        p.contacts,
        profileComplete: true,
        isDummy:         true
      });
      createdUsers.push(user);
      process.stdout.write('.');
    }
    console.log(`\n✅ Created ${createdUsers.length} dummy providers`);

    // Create a dummy customer to attach posts to
    const dummyCustomer = await User.create({
      name: 'Demo Customer', email: 'democustomer@demo.neighbourhub.in',
      password, role: 'customer', username: 'democustomer',
      about: 'Demo', location: 'Lucknow', profileComplete: true, isDummy: true
    });

    for (const p of dummyPosts) {
      await Post.create({
        userId: dummyCustomer._id,
        userName: p.userName,
        profession: p.profession,
        description: p.description,
        isDummy: true
      });
      process.stdout.write('.');
    }
    console.log(`\n✅ Created ${dummyPosts.length} dummy posts`);

    // ── Dummy Reviews ─────────────────────────────────────
    const reviewTexts = [
      { rating: 5, text: 'Excellent work! Very professional and arrived on time. Highly recommend.' },
      { rating: 5, text: 'Outstanding service. Fixed the problem quickly and the price was fair.' },
      { rating: 4, text: 'Good service overall. Very polite and did the job well. Would hire again.' },
      { rating: 4, text: 'Satisfied with the work. Arrived a bit late but the quality was great.' },
      { rating: 3, text: 'Decent work but took longer than expected. Result was okay.' },
      { rating: 5, text: 'Absolutely brilliant! One of the best I have hired in Lucknow.' },
      { rating: 4, text: 'Very knowledgeable and helpful. Explained everything clearly.' },
      { rating: 5, text: 'Superb! Will definitely call again. Very trustworthy and efficient.' },
      { rating: 3, text: 'Average experience. Did the job but communication could be better.' },
      { rating: 4, text: 'Good value for money. Professional attitude throughout.' },
    ];
    const customerNames = ['Anjali Singh','Vikram Mehta','Pooja Rao','Sanjay Gupta','Deepa Nair','Arjun Verma','Kavitha Sharma','Rahul Joshi'];

    let reviewCount = 0;
    for (const provider of createdUsers) {
      // 2-4 reviews per provider
      const numReviews = 2 + Math.floor(Math.random() * 3);
      const usedTexts = new Set();
      const ratings = [];
      for (let i = 0; i < numReviews; i++) {
        let rt;
        do { rt = reviewTexts[Math.floor(Math.random() * reviewTexts.length)]; }
        while (usedTexts.has(rt.text));
        usedTexts.add(rt.text);
        ratings.push(rt.rating);
        await Review.create({
          providerId:   provider._id,
          customerId:   dummyCustomer._id,
          customerName: customerNames[Math.floor(Math.random() * customerNames.length)],
          rating:       rt.rating,
          text:         rt.text,
          isDummy:      true
        }).catch(() => {}); // skip duplicate key on re-seed
        reviewCount++;
        process.stdout.write('.');
      }
      // Set avgRating on provider
      const avg = ratings.reduce((s, r) => s + r, 0) / ratings.length;
      await User.findByIdAndUpdate(provider._id, { avgRating: parseFloat(avg.toFixed(1)) });
    }
    console.log(`\n✅ Created ${reviewCount} dummy reviews`);

    console.log('\n🎉 Seed complete! Your database is ready.\n');
    process.exit(0);
  } catch (err) {
    console.error('❌ Seed failed:', err.message);
    process.exit(1);
  }
}

seed();
