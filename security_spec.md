# SmartHire AI Firestore Security Specification

This document details the Attribute-Based Access Control (ABAC) invariants, security test payloads, and firestore assertions designed for the SmartHire platform.

## 1. Data Invariants

- **User Accounts**: A user is only authorised to create or modify their own user profile document (`request.auth.uid == userId`). Multi-role RBAC fields (such as `role` or `status`) are strictly locked after signup to prevent self-promoted escalation vectors.
- **Jobs**: Only authenticated users with the `recruiter` role verified through corporate listings can create or update jobs listing documents.
- **Applications**: Candidates can submit (`create`) application cards, which must link their unique system `candidateId` to an existing published `jobId`. Relational states (such as `status`) can only be modified by the parent job owner (recruiter) or an platform admin.
- **Interviews**: Only recruiters listed on the specific job application can schedule or cancel interview meetings.
- **PII Integrity**: Sensitive files and personal contact fields remain isolated to verified owners or active assigned recruiters during an invitation loop.

## 2. Testing Payloads

These 12 scenarios test the robustness of our rules layout:

| Payload Ref | Intent | Target Path | Expected Outcome |
|---|---|---|---|
| P_01 | Spoof user ID write | `/users/hack_uid` | `PERMISSION_DENIED` |
| P_02 | Candidate publishing a corporate job listings | `/jobs/job_hack` | `PERMISSION_DENIED` |
| P_03 | Candidate upgrading their own app status to `selected` | `/applications/app_hack` | `PERMISSION_DENIED` |
| P_04 | Non-owner requesting candidate contact sheets | `/profiles/cand_secret` | `PERMISSION_DENIED` |
| P_05 | Ingress ID poisoning attack with oversized string | `/jobs/INVALID!!LONGSTRING` | `PERMISSION_DENIED` |
| P_06 | Overwrite `createdAt` or immutables post-creation | `/jobs/job_1` | `PERMISSION_DENIED` |
| P_07 | Alter system AI ATS resume scoring parameters from client | `/applications/app_1` | `PERMISSION_DENIED` |
| P_08 | Guest/Anonymous user submitting jobs | `/jobs/job_nomad` | `PERMISSION_DENIED` |
| P_09 | Delete logging records or notifications | `/notifications/not_1` | `PERMISSION_DENIED` |
| P_10 | Direct update on application notes by non-recruiter | `/applications/app_2` | `PERMISSION_DENIED` |
| P_11 | Setting user role to `admin` in update profile | `/users/cand_1` | `PERMISSION_DENIED` |
| P_12 | Access private messaging archive of third party | `/messages/cand_99_rec_99` | `PERMISSION_DENIED` |
