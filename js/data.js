/* data.js — seed/mock data. Everything here is FICTIONAL demo content. */
const _t = {
  Design:{ r:['Sketch concepts and layouts','Prepare presentation boards','Collect feedback from the team'], q:['Portfolio with 2-3 projects','Comfort with design tools'], p:['Print or motion experience'] },
  Engineering:{ r:['Build and test small features','Fix bugs from the backlog','Write clear documentation'], q:['Solid fundamentals in one language','Basic Git'], p:['A personal or class project online'] },
  Marketing:{ r:['Draft posts and captions','Track weekly engagement','Help plan campaigns'], q:['Strong writing','Curiosity about social platforms'], p:['Video editing'] },
  Data:{ r:['Clean and explore datasets','Build simple dashboards','Present findings to the team'], q:['Spreadsheet and SQL basics','Statistics coursework'], p:['Python or R'] },
  Business:{ r:['Research potential partners','Prepare outreach emails','Support sales reports'], q:['Good communication','Organised and reliable'], p:['Prior club or society leadership'] },
  Writing:{ r:['Write blog posts and guides','Edit drafts with the team','Check facts and sources'], q:['Clear, correct English','Writing samples'], p:['SEO basics'] }
};
const _i = (id,co,title,cat,loc,mode,skills,stipend,dur,deadline,posted,openings) => ({
  id, companyId:co, title, category:cat, location:loc, mode, skills, stipend, duration:dur, deadline, posted, openings,
  description:`Work with a friendly team as a ${title}. You will learn on real projects with a mentor checking in each week.`,
  responsibilities:_t[cat].r, qualifications:_t[cat].q, preferred:_t[cat].p
});
const DATA = {
  VERSION: 2,
  CATEGORIES: ['Design','Engineering','Marketing','Data','Business','Writing'],
  STATUSES: ['applied','review','shortlisted','interview','selected','rejected'], // single source of truth
  STATUS_LABELS: { applied:'Applied', review:'Under Review', shortlisted:'Shortlisted', interview:'Interview', selected:'Selected', rejected:'Rejected', withdrawn:'Withdrawn' },
  STATUS_HELP: {
    applied:'Your application was sent. Waiting for the company to open it.',
    review:'A recruiter is reading your application.',
    shortlisted:'You made the short list. More news soon.',
    interview:'An interview is scheduled. Check the date.',
    selected:'Congratulations, you got the internship.',
    rejected:'Not this time. Keep applying.'
  },
  seed: {
    users: [
      { id:'u_student', role:'student', name:'Maya Rahman', email:'student@demo.test' },
      { id:'u_recruiter', role:'recruiter', name:'Jordan Lee', email:'recruiter@demo.test', companyId:'c1' },
      { id:'u_admin', role:'admin', name:'Admin Demo', email:'admin@demo.test' },
      { id:'u_s2', role:'student', name:'Arjun Das', email:'arjun@demo.test' },
      { id:'u_s3', role:'student', name:'Lina Chowdhury', email:'lina@demo.test' },
      { id:'u_s4', role:'student', name:'Sam Karim', email:'sam@demo.test' },
      { id:'u_r2', role:'recruiter', name:'Priya Nair', email:'priya@demo.test', companyId:'c2' }
    ],
    session: null,
    companies: [
      { id:'c1', name:'Paperplane Studio', initials:'PS', color:'#e5412d', verified:true, about:'A fictional design studio making playful brand work for local businesses.' },
      { id:'c2', name:'Greenbyte Labs', initials:'GL', color:'#2f5d3a', verified:true, about:'A fictional climate-tech startup building energy dashboards.' },
      { id:'c3', name:'Retro Rocket Media', initials:'RR', color:'#7c3aed', verified:false, about:'A fictional marketing collective with a love for the 90s.' },
      { id:'c4', name:'Lighthouse Analytics', initials:'LA', color:'#2f7a76', verified:true, about:'A fictional data consultancy helping small firms decide with numbers.' }
    ],
    internships: [
      _i('i1','c1','Brand Design Intern','Design','Dhaka','hybrid',['Figma','Illustration','Typography'],15000,'3 months','2026-12-15','2026-10-20',2),
      _i('i2','c2','Frontend Developer Intern','Engineering','Remote','remote',['HTML','CSS','JavaScript'],20000,'6 months','2026-11-30','2026-10-25',3),
      _i('i3','c3','Social Media Intern','Marketing','Chattogram','onsite',['Copywriting','Canva'],0,'2 months','2026-11-20','2026-10-10',1),
      _i('i4','c1','Motion Graphics Intern','Design','Remote','remote',['After Effects','Storyboarding'],12000,'3 months','2026-12-05','2026-10-22',1),
      _i('i5','c2','Data Analyst Intern','Data','Dhaka','hybrid',['SQL','Excel','Python'],18000,'4 months','2026-11-25','2026-10-18',2),
      _i('i6','c3','Content Writing Intern','Writing','Remote','remote',['Writing','Research','SEO'],8000,'2 months','2026-12-10','2026-10-27',2),
      _i('i7','c4','Business Development Intern','Business','Sylhet','onsite',['Communication','Excel'],10000,'3 months','2026-12-20','2026-10-15',1),
      _i('i8','c4','Backend Engineering Intern','Engineering','Dhaka','onsite',['Node.js','SQL','Git'],22000,'6 months','2026-11-28','2026-10-26',2),
      _i('i9','c1','UX Research Intern','Design','Dhaka','onsite',['Interviews','Figma','Surveys'],0,'3 months','2026-12-01','2026-10-12',1)
    ],
    applications: [
      { id:'a1', internshipId:'i1', studentId:'u_student', status:'review', appliedAt:'2026-10-22', updatedAt:'2026-10-26', interviewAt:null },
      { id:'a2', internshipId:'i2', studentId:'u_student', status:'interview', appliedAt:'2026-10-18', updatedAt:'2026-10-27', interviewAt:'2026-11-05T10:00' },
      { id:'a3', internshipId:'i1', studentId:'u_s2', status:'applied', appliedAt:'2026-10-27', updatedAt:'2026-10-27', interviewAt:null },
      { id:'a4', internshipId:'i1', studentId:'u_s3', status:'shortlisted', appliedAt:'2026-10-23', updatedAt:'2026-10-28', interviewAt:null },
      { id:'a5', internshipId:'i4', studentId:'u_s4', status:'review', appliedAt:'2026-10-24', updatedAt:'2026-10-26', interviewAt:null },
      { id:'a6', internshipId:'i9', studentId:'u_s2', status:'interview', appliedAt:'2026-10-20', updatedAt:'2026-10-28', interviewAt:'2026-11-03T14:00' },
      { id:'a7', internshipId:'i4', studentId:'u_s3', status:'applied', appliedAt:'2026-10-28', updatedAt:'2026-10-28', interviewAt:null },
      { id:'a8', internshipId:'i5', studentId:'u_s4', status:'applied', appliedAt:'2026-10-28', updatedAt:'2026-10-28', interviewAt:null }
    ],
    saved: { u_student: ['i3','i5'] },
    viewed: { u_student: ['i6'] },
    notifications: [
      { id:'n1', userId:'u_student', type:'interview', text:'Interview invitation: Frontend Developer Intern at Greenbyte Labs on 5 Nov, 10:00.', at:'2026-10-27T09:00', read:false },
      { id:'n2', userId:'u_student', type:'status', text:'Your Brand Design Intern application is now Under Review.', at:'2026-10-26T15:20', read:false },
      { id:'n3', userId:'u_student', type:'deadline', text:'Deadline soon: Social Media Intern closes on 20 Nov.', at:'2026-10-25T08:00', read:true },
      { id:'n4', userId:'u_student', type:'match', text:'New match: Data Analyst Intern fits your skills.', at:'2026-10-24T11:00', read:true },
      { id:'n5', userId:'u_recruiter', type:'received', text:'New applicant: Arjun Das for Brand Design Intern.', at:'2026-10-27T12:00', read:false },
      { id:'n6', userId:'u_recruiter', type:'received', text:'New applicant: Lina Chowdhury for Motion Graphics Intern.', at:'2026-10-28T10:00', read:false }
    ],
    conversations: [
      { id:'m1', studentId:'u_student', companyId:'c2', messages:[{ from:'recruiter', text:'Hi Maya, thanks for applying. Does the 5th of November still suit you?', at:'2026-10-27T09:30' }], unread:{ student:1, recruiter:0 } },
      { id:'m2', studentId:'u_s2', companyId:'c1', messages:[{ from:'student', text:'Hello! Quick question about the UX research interview format.', at:'2026-10-28T16:10' }], unread:{ student:0, recruiter:1 } }
    ],
    reports: [
      { id:'r1', internshipId:'i3', reason:'Listing is unpaid but asks applicants for a fee.' },
      { id:'r2', internshipId:'i6', reason:'Possible duplicate of another listing.' }
    ],
    profiles: {
      u_student:{ university:'BRAC University', degree:'BSc Computer Science', gradYear:2027, skills:['HTML','CSS','JavaScript'], projects:['Campus event board (HTML/CSS/JS)'], certifications:[], portfolio:'', linkedin:'', bio:'Third-year student who likes building small, friendly web tools.', resume:null },
      u_s2:{ university:'University of Dhaka', degree:'BA Design', gradYear:2026, skills:['Figma','Interviews','Surveys'], projects:['Bus route app redesign'], certifications:['Google UX Certificate'], portfolio:'https://example.com/arjun', linkedin:'', bio:'Designer who loves talking to users.', resume:{ name:'arjun-cv.pdf', size:120400 } },
      u_s3:{ university:'North South University', degree:'BBA Marketing', gradYear:2027, skills:['Illustration','Typography','After Effects'], projects:['Rebrand of a campus cafe'], certifications:[], portfolio:'https://example.com/lina', linkedin:'', bio:'Illustrator exploring motion.', resume:{ name:'lina-portfolio.pdf', size:380200 } },
      u_s4:{ university:'BUET', degree:'BSc CSE', gradYear:2026, skills:['After Effects','Storyboarding','SQL','Python'], projects:['Short film titles'], certifications:[], portfolio:'', linkedin:'', bio:'Part developer, part animator.', resume:null }
    }
  }
};
