# Project file structure 

```
/
│
├── app.js
├── server.js
│
├── config/
│   ├── db.js
│   ├── jwt.js
│
├── models/
│   ├── User.model.js
|   ├── Company.model.js
│   ├── Post.model.js
│   ├── Comment.model.js
│   ├── Reaction.model.js
│   ├── JobOffer.model.js
│   ├── Connection.model.js
│   ├── Message.model.js
│   ├── Notification.model.js
│
├── routes/
├── services/
├── middlewares/
├── utils/
└── uploads/
│   ├── videos/
│   └── files/
```

# Models Reference

This document describes the Mongoose models in this folder.

Files covered:
- `comment.model.js`
- `company.model.js`
- `connection.model.js`
- `joboffer.model.js`
- `message.model.js`
- `notification.model.js`
- `post.model.js`
- `reaction.model.js`
- `user.model.js`
---

## comment.model.js

Purpose: Stores comments on posts. Supports polymorphic authors (User or Company) and threaded replies.

Schema summary:
- `postId` (ObjectId, ref: `Post`, required) — the post this comment belongs to.
- `author` (object) — polymorphic author reference:
  - `author.id` (ObjectId, required) — the referenced document id.
  - `author.type` (String, enum: ['User', 'Company'], default: 'User') — the model name to use for `refPath`.
- `parentCommentId` (ObjectId, ref: `Comment`, default: null) — used for threading; null for top-level comments.
- `content` (String, required, trim) — comment text.
- `createdAt` (Date, default: Date.now)

Indexes:
- `{ postId: 1, createdAt: 1 }` — to quickly load comments for a post in time order.
- `{ parentCommentId: 1 }` — to efficiently load replies for a comment.

Notes / Behavior:
- Polymorphic author: `author.id` references different collections based on `author.type` using Mongoose `refPath`.
- Threading: replies are comments whose `parentCommentId` points to another comment.

---

## company.model.js

Purpose: Stores company profiles that can act as authors of posts/comments and create job offers.

Likely fields (assumptions):
- `name` (String, required)
- `email` (String)
- `website` (String)
- `description` (String)
- `logo` (String / URL)
- `location` (String)
- `createdAt` (Date)
- `followers` (Array of ObjectId referencing `User`) — optional

---

## connection.model.js

Purpose: Represents a connection/relationship between two users (like LinkedIn connections).

Likely fields:
- `requester` (ObjectId, ref: `User`) — who initiated the connection
- `recipient` (ObjectId, ref: `User`) — who received the request
- `status` (String, e.g., 'pending'|'accepted'|'declined')
- `createdAt`, `updatedAt`

Notes: could also store `type` (e.g., 'follow' vs 'connect') depending on app semantics.

---

## joboffer.model.js

Purpose: Job offers posted by companies.

Likely fields:
- `companyId` (ObjectId, ref: `Company`, required)
- `title` (String, required)
- `description` (String)
- `location` (String)
- `employmentType` (String, e.g., 'Full-time')
- `salaryRange` (String / Number fields)
- `createdAt`, `expiresAt`
- `applicants` (Array of ObjectId or subdocs referencing `User` applications)

Notes: adjust to actual schema for field names and validations.

---

## message.model.js

Purpose : Direct messages between users (or between user/company).

Likely fields:
- `from` (ObjectId, ref: `User` or polymorphic)
- `to` (ObjectId, ref: `User` or a conversation id)
- `content` (String)
- `attachments` (Array)
- `read` (Boolean)
- `createdAt` (Date)

Notes: If the app supports threaded conversations, messages may belong to a `Conversation` model instead.

---

## notification.model.js

Purpose : Stores notifications to be shown to users.

Likely fields:
- `userId` (ObjectId, ref: `User`, required) — who gets the notification
- `type` (String) — e.g., 'like', 'comment', 'connection', 'message'
- `read` (Boolean, default: false)
- `createdAt` (Date)

Usage: mark notifications read with an update to `read`.

---

## post.model.js 

Purpose : Stores posts created by users or companies.

Likely fields:
- `author` (polymorphic object or `authorId` + `authorType`) — reference to `User` or `Company`
- `content` (String)
- `media` (Array of URLs or subdocuments)
- `createdAt`, `updatedAt`
- `likesCount`, `commentsCount` (Number) — optional denormalized counts in this we gonna make in every reaction or comment added a +1 gonna added to the likes or comments count
Relations:
- `Post` is referenced by `Comment.postId` and `Reaction`.

---

## reaction.model.js 

Purpose : Stores reactions (likes, loves, etc.) on posts or comments.

Likely fields:
- `author` (ObjectId, ref: `User` or `Company` polymorphic)
- `type` (String, e.g., 'like'|'love'|'celebrate')
- `postId` (ObjectId, ref: `Post`) and/or `commentId` (ObjectId, ref: `Comment`)and/or `MessageId` (ObjectId, ref: `Message`)
- `createdAt` (Date)

---

## user.model.js 

Purpose: Stores application users.

Likely fields:
- `firstName`, `lastName` 
- `email` (String, unique)
- `password` (String, hashed)
- `avatar` (String)
- `bio` (String)
- `location`(String)
- `experiences` / `education` (Array of subdocuments)
- `connections` or `followers` (Array of ObjectId refs)
- `createdAt`, `lastActive`

Notes: adapt to the real schema for exact fields and constraints.

---
