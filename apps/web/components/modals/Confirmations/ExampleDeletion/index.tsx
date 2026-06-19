import ConfirmationModal from '../ConfirmationModal';

export default function ExampleDeletion({ id }: { id?: string }) {
  const handleConfirm = async () => {
    // Replace with the actual mutation. Swallow rejection only if the
    // mutation hook surfaces its own toast — otherwise let it throw so
    // ConfirmationModal logs it and keeps the dialog open.
    console.log('deleting', id);
  };

  return (
    <ConfirmationModal
      title="Delete this item?"
      subtitle="This cannot be undone."
      confirmButtonText="Delete"
      onConfirm={handleConfirm}
    />
  );
}
