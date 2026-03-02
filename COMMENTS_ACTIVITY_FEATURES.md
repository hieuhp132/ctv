# Program Detail - Comments & Activity Features

## Overview
Added two new sections to the Program/Job Detail page:
1. **Comments & Discussion** - Collaborative discussion section
2. **Activity Timeline** - Track all admin activities and changes

## Features

### Comments Section (`Comments.jsx`)
- **Add Comments**: Users can post comments on job details
- **Edit Comments**: Users can edit their own comments (or admins can edit any)
- **Delete Comments**: Remove comments with confirmation
- **Author Info**: Display user name, role badge, and timestamp
- **Responsive**: Mobile-friendly layout
- **Local Storage**: Persists comments data

**Features:**
- Real-time relative timestamps (e.g., "5 minutes ago")
- Role-based styling (Admin in red, Recruiter in blue)
- Edit history tracking
- Admin can manage all comments

### Activity Timeline (`Activity.jsx`)
- **Visual Timeline**: Color-coded activity indicators
- **Activity Types**: Create, Edit, Delete, Submit, Approve, Reject, Comment, Upload, Download, Status Change, View
- **Timestamps**: Shows when activities occurred
- **Details**: Additional metadata for each activity
- **Scrollable**: Shows last 15 activities with scroll capability

**Activity Icons & Colors:**
- 📝 Create - Green
- ✏️ Edit - Amber
- 🗑️ Delete - Red
- 📤 Submit - Blue
- ✅ Approve - Green
- ❌ Reject - Red
- 💬 Comment - Purple
- 📁 Upload - Cyan
- 📥 Download - Blue

## Files Modified/Created

### New Components
- `src/components/Comments.jsx` - Comments component
- `src/components/Comments.css` - Comments styling
- `src/components/Activity.jsx` - Activity timeline component
- `src/components/Activity.css` - Activity styling

### Modified Files
- `src/pages/recruiter/jobs/Detail.jsx` - Integrated comments & activity
- `src/pages/admin/jobs/Detail.jsx` - Integrated comments & activity
- `src/pages/admin/jobs/Detail.css` - Added container styles

## Usage

### Importing Components
```jsx
import Comments from "../../../components/Comments";
import Activity from "../../../components/Activity";
```

### Adding Comments Section
```jsx
<section className="comments-activity-container">
  <Comments jobId={id} isAdmin={isAdmin} />
</section>
```

### Adding Activity Section
```jsx
<section className="comments-activity-container">
  <Activity jobId={id} />
</section>
```

### Logging Activities from Other Components
Activities can be logged by calling:
```javascript
window.addJobActivity(type, description, metadata);
```

**Example:**
```javascript
window.addJobActivity(
  'submit',
  'New candidate submitted',
  { details: 'John Doe - Senior Developer' }
);
```

### Activity Types
```javascript
'create'       // Job created
'edit'         // Job edited
'delete'       // Job deleted
'submit'       // Candidate submitted
'approve'      // Candidate approved
'reject'       // Candidate rejected
'comment'      // Comment added
'upload'       // File uploaded
'download'     // File downloaded
'status_change'// Status changed
'view'         // Job viewed
```

## Data Storage

Both comments and activities are stored in **localStorage** with keys:
- Comments: `comments_{jobId}`
- Activities: `activities_{jobId}`

This allows persistence across page reloads without backend requirements.

## Styling

### CSS Classes
- `.comments-section` - Comments container
- `.activity-section` - Activity container
- `.add-comment-form` - Comment input form
- `.comments-list` - Comments list
- `.comment-item` - Individual comment
- `.activity-timeline` - Timeline container
- `.activity-item` - Individual activity item
- `.activity-icon` - Activity icon
- `.activity-content` - Activity description
- `.comments-activity-container` - Container wrapper

### Responsive Design
- Mobile breakpoint: 768px
- Tablet breakpoint: 900px
- Desktop: Full width with fixed sidebar

## User Permissions

### Comments Management
- **Authors**: Can edit/delete their own comments
- **Admins**: Can edit/delete any comment
- **All Users**: Can view all comments

### Activity Viewing
- **All Users**: Can view activity timeline (read-only)
- **Admins**: Can log new activities

## Browser Compatibility
- Modern browsers supporting:
  - CSS Grid & Flexbox
  - localStorage API
  - Date formatting APIs

## Future Enhancements
1. Backend integration for persistent storage
2. Comment notifications/mentions
3. Activity filtering options
4. Export activity logs
5. Comment threading/replies
6. Activity date range filtering
7. Real-time updates with WebSocket
