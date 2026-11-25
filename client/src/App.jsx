import { useEffect, useState } from 'react';
import { Link, Navigate, Route, Routes, useNavigate } from 'react-router-dom';
import api from './api';

function Shell({ user, setUser, children }) {
  const navigate = useNavigate();
  async function logout() { await api.post('/auth/logout'); setUser(null); navigate('/'); }
  return <><header><Link className="brand" to="/">CodeLift</Link><nav><Link to="/">Home</Link>{user && <Link to="/learn">Learning</Link>}{user?.role === 'admin' && <Link to="/admin">Admin</Link>}{user ? <button className="link-button" onClick={logout}>Logout</button> : <><Link to="/login">Login</Link><Link className="nav-cta" to="/register">Register</Link></>}</nav></header><main>{children}</main><footer>CodeLift · Learn. Build. Elevate.</footer></>;
}
function Home() { return <section className="hero"><span className="eyebrow">LEARN · BUILD · ELEVATE</span><h1>Build skills.<br/><em>Build your future.</em></h1><p>A learning community for developers who want to learn through structured courses and practical projects.</p><div className="actions"><Link className="button" to="/register">Join CodeLift</Link><Link className="button secondary" to="/login">Student login</Link></div></section>; }
function AuthForm({ mode, setUser }) {
  const [form,setForm]=useState({name:'',email:'',password:''}); const [message,setMessage]=useState(''); const [busy,setBusy]=useState(false); const nav=useNavigate();
  async function submit(e){e.preventDefault();setBusy(true);setMessage('');try{if(mode==='register'){const r=await api.post('/auth/register',form);setMessage(r.data.message);}else{const r=await api.post('/auth/login',form);setUser(r.data.user);nav(r.data.user.role==='admin'?'/admin':'/learn');}}catch(err){setMessage(err.response?.data?.message||'Something went wrong.');}finally{setBusy(false);}}
  return <section className="panel narrow"><h1>{mode==='register'?'Create your account':'Welcome back'}</h1><p className="muted">{mode==='register'?'Your account will be reviewed by the CodeLift administrator.':'Sign in to continue learning.'}</p><form onSubmit={submit}>{mode==='register'&&<label>Full name<input required minLength="2" value={form.name} onChange={e=>setForm({...form,name:e.target.value})}/></label>}<label>Email<input required type="email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})}/></label><label>Password<input required type="password" minLength="10" value={form.password} onChange={e=>setForm({...form,password:e.target.value})}/></label><button className="button" disabled={busy}>{busy?'Please wait…':mode==='register'?'Submit registration':'Login'}</button></form>{message&&<p className="notice">{message}</p>}</section>;
}
function Admin({ user }) {
  const [pending,setPending]=useState([]); const [courses,setCourses]=useState([]); const [enrollments,setEnrollments]=useState([]); const [message,setMessage]=useState('');
  const [course,setCourse]=useState({title:'',slug:'',description:''}); const [video,setVideo]=useState({courseId:'',title:'',description:'',file:null});
  async function load(){const [u,e,c]=await Promise.all([api.get('/admin/pending-users'),api.get('/admin/enrollments/pending'),api.get('/admin/courses')]);setPending(u.data.users);setEnrollments(e.data.enrollments);setCourses(c.data.courses);}
  useEffect(()=>{load().catch(()=>{});},[]);
  async function approveUser(id,status){await api.patch(`/admin/users/${id}/approval`,{status});load();}
  async function approveEnrollment(id,status){await api.patch(`/admin/enrollments/${id}/approval`,{status});load();}
  async function createCourse(e){e.preventDefault();try{await api.post('/admin/courses',course);setMessage('Course created. Publish it below when it is ready for students.');setCourse({title:'',slug:'',description:''});await load();}catch(err){setMessage(err.response?.data?.message||'Could not create course.');}}
  async function toggleCourse(c){await api.patch(`/admin/courses/${c._id}/publish`,{published:!c.published});await load();}
  async function toggleVideo(v){await api.patch(`/admin/videos/${v._id}/publish`,{published:!v.published});await load();}
  async function uploadVideo(e){e.preventDefault();if(!video.file)return setMessage('Choose a video file first.');try{const r=await api.post('/admin/videos/direct-upload',{courseId:video.courseId,title:video.title,description:video.description});const body=new FormData();body.append('file',video.file);const up=await fetch(r.data.uploadUrl,{method:'POST',body});if(!up.ok)throw new Error('Cloudflare upload failed.');setMessage('Upload sent. The video is saved as unpublished. Refresh the page after processing, then publish it from the video management section.');}catch(err){setMessage(err.response?.data?.message||err.message||'Upload failed.');}}
  if(user?.role!=='admin')return <Navigate to="/learn"/>;
  return <div className="stack"><div><span className="eyebrow">ADMINISTRATOR</span><h1>Admin dashboard</h1><p className="muted">Manage registrations, course access and lecture content.</p></div>
    <div className="grid two"><section className="panel"><h2>Pending registrations</h2>{pending.length===0?<p className="muted">No pending registrations.</p>:pending.map(u=><div className="list-row" key={u._id}><div><b>{u.name}</b><small>{u.email}</small></div><div className="actions"><button onClick={()=>approveUser(u._id,'approved')}>Approve</button><button className="danger" onClick={()=>approveUser(u._id,'rejected')}>Reject</button></div></div>)}</section>
    <section className="panel"><h2>Pending course enrollments</h2>{enrollments.length===0?<p className="muted">No pending enrollments.</p>:enrollments.map(x=><div className="list-row" key={x._id}><div><b>{x.user?.name}</b><small>{x.course?.title}</small></div><div className="actions"><button onClick={()=>approveEnrollment(x._id,'approved')}>Approve</button><button className="danger" onClick={()=>approveEnrollment(x._id,'rejected')}>Reject</button></div></div>)}</section></div>
    <section className="panel"><h2>Create a course</h2><form className="form-grid" onSubmit={createCourse}><label>Course title<input required value={course.title} onChange={e=>setCourse({...course,title:e.target.value})}/></label><label>URL slug<input required value={course.slug} onChange={e=>setCourse({...course,slug:e.target.value})} placeholder="web-development"/></label><label className="wide">Description<textarea value={course.description} onChange={e=>setCourse({...course,description:e.target.value})}/></label><button className="button">Create course</button></form></section>
    <section className="panel"><h2>Manage courses</h2>{courses.length===0?<p className="muted">No courses created yet.</p>:courses.map(c=><div className="list-row" key={c._id}><div><b>{c.title}</b><small>{c.slug} · {c.published?'Published':'Draft'}</small></div><button onClick={()=>toggleCourse(c)}>{c.published?'Unpublish':'Publish'}</button></div>)}</section>
    <section className="panel"><h2>Upload a lecture</h2><p className="muted">Only the administrator can request an upload URL. Videos are private and unpublished by default.</p><form className="form-grid" onSubmit={uploadVideo}><label>Course<select required value={video.courseId} onChange={e=>setVideo({...video,courseId:e.target.value})}><option value="">Select course</option>{courses.map(c=><option key={c._id} value={c._id}>{c.title}</option>)}</select></label><label>Video title<input required value={video.title} onChange={e=>setVideo({...video,title:e.target.value})}/></label><label className="wide">Description<textarea value={video.description} onChange={e=>setVideo({...video,description:e.target.value})}/></label><label className="wide">Video file<input required type="file" accept="video/*" onChange={e=>setVideo({...video,file:e.target.files?.[0]||null})}/></label><button className="button">Upload video</button></form></section><section className="panel"><h2>Video publishing</h2>{courses.map(c=><CourseAdminVideos key={c._id} course={c} onToggle={toggleVideo}/>)}</section>{message&&<p className="notice">{message}</p>}</div>;
}
function CourseAdminVideos({course,onToggle}) {
  const [videos,setVideos]=useState([]);
  useEffect(()=>{api.get(`/admin/courses/${course._id}/videos`).then(r=>setVideos(r.data.videos)).catch(()=>{});},[course._id]);
  return <div className="video-area"><h3>{course.title}</h3>{videos.length===0?<p className="muted">No videos uploaded for this course yet.</p>:videos.map(v=><div className="list-row" key={v._id}><div><b>{v.title}</b><small>{v.published?'Published':'Unpublished'}</small></div><button onClick={()=>onToggle(v)}>{v.published?'Unpublish':'Publish'}</button></div>)}</div>;
}

function Learning({ user }) {
  const [courses,setCourses]=useState([]); const [message,setMessage]=useState('');
  useEffect(()=>{api.get('/learning/courses').then(r=>setCourses(r.data.courses)).catch(e=>setMessage(e.response?.data?.message||'Could not load courses.'));},[]);
  async function enroll(id){try{const r=await api.post(`/learning/courses/${id}/enroll`);setMessage(r.data.enrollment.status==='approved'?'You are enrolled.':'Enrollment request submitted for admin approval.');}catch(e){setMessage(e.response?.data?.message||'Could not request enrollment.');}}
  if(!user)return <Navigate to="/login"/>;
  return <div className="stack"><h1>My learning</h1><p className="muted">Request access to a course. The administrator must approve enrollment before its videos become available.</p><div className="grid two">{courses.map(c=><article className="panel" key={c._id}><h2>{c.title}</h2><p>{c.description}</p><p className="status">Access: {c.enrollmentStatus}</p>{c.enrollmentStatus==='approved'?<CourseVideos course={c}/>:c.enrollmentStatus==='pending'?<button disabled>Awaiting approval</button>:<button onClick={()=>enroll(c._id)}>Request enrollment</button>}</article>)}</div>{message&&<p className="notice">{message}</p>}</div>;
}
function CourseVideos({course}) {
  const [videos,setVideos]=useState([]); const [active,setActive]=useState(null); const [playUrl,setPlayUrl]=useState('');
  useEffect(()=>{api.get(`/learning/courses/${course._id}/videos`).then(r=>setVideos(r.data.videos));},[course._id]);
  async function play(v){setActive(v);setPlayUrl('');try{const r=await api.post(`/learning/videos/${v._id}/playback`);setPlayUrl(r.data.iframeUrl);}catch(e){alert(e.response?.data?.message||'Playback unavailable.');}}
  return <div className="video-area"><h3>Available lectures</h3>{videos.map(v=><button className="lecture" key={v._id} onClick={()=>play(v)}>{v.title}</button>)}{active&&playUrl&&<div className="player"><iframe src={playUrl} title={active.title} allow="accelerometer; autoplay; encrypted-media; picture-in-picture" allowFullScreen/></div>}</div>;
}
export default function App(){
  const [user,setUser]=useState(null); const [ready,setReady]=useState(false);
  useEffect(()=>{api.get('/auth/me').then(r=>setUser(r.data.user)).catch(()=>{}).finally(()=>setReady(true));},[]);
  if(!ready)return <div className="loading">Loading CodeLift…</div>;
  return <Shell user={user} setUser={setUser}><Routes><Route path="/" element={<Home/>}/><Route path="/register" element={<AuthForm mode="register" setUser={setUser}/>}/><Route path="/login" element={<AuthForm mode="login" setUser={setUser}/>}/><Route path="/learn" element={user?.role==='admin'?<Admin user={user}/>:<Learning user={user}/>}/><Route path="/admin" element={<Admin user={user}/>}/><Route path="*" element={<Home/>}/></Routes></Shell>;
}
