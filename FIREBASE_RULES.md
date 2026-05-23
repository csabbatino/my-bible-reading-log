# Firebase Security Rules

After creating your Firestore database, go to:
Firebase Console → Firestore Database → Rules

Paste these rules and click "Publish":

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Users can read/write their own profile
    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth.uid == userId;

      // Users can read/write their own progress
      match /progress/{bookId} {
        allow read: if request.auth != null;
        allow write: if request.auth.uid == userId;
      }

      // Users can read/write their own notes
      // Only public notes are readable by others
      match /notes/{noteId} {
        allow read: if request.auth.uid == userId
          || (request.auth != null && resource.data.isPublic == true);
        allow write: if request.auth.uid == userId;
      }
    }

    // Family groups: members can read, owner can write
    match /familyGroups/{groupId} {
      allow read: if request.auth != null
        && request.auth.uid in resource.data.members;
      allow create: if request.auth != null
        && request.auth.uid == request.resource.data.createdBy;
      allow update: if request.auth != null
        && request.auth.uid == resource.data.createdBy;
    }
  }
}
```
