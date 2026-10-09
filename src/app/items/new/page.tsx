import ItemForm from "./item-form";

export default function NewItemPage() {
  return (
    <main className="mx-auto w-full max-w-xl p-6">
      <h1 className="mb-6 text-2xl font-bold">เพิ่มรายการ</h1>
      <ItemForm />
    </main>
  );
}
