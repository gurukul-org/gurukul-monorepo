import { Suspense } from "react";

import AcceptInvitation from "@/containers/Apex/Invitations/Accept";

export default function AcceptInvitationPage() {
  return (
    <Suspense fallback={null}>
      <AcceptInvitation />
    </Suspense>
  );
}

