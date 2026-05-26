# Firebase Security Rules

After creating your Firestore database, go to:
Firebase Console → Firestore Database → Rules

Paste these rules and click "Publish":

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth.uid == userId
        || request.auth != null;

      match /progress/{bookId} {
        allow read: if request.auth != null;
        allow write: if request.auth.uid == userId;
      }

      match /notes/{noteId} {
        allow read: if request.auth.uid == userId
          || (request.auth != null && resource.data.isPublic == true);
        allow write: if request.auth.uid == userId;
      }

      match /meta/{metaId} {
        allow read: if request.auth != null;
        allow write: if request.auth.uid == userId;
      }
    }

    match /familyGroups/{groupId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null
        && request.auth.uid == request.resource.data.createdBy;
      allow update: if request.auth != null;
    }

    match /pendingInvitations/{email} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
    }
  }
}
```
