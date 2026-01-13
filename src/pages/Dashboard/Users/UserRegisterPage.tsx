import PageMeta from "../../../components/common/PageMeta";
import UserRegister from "../../../components/user/UserRegister";

export default function Home() {
  return (
    <>
      <PageMeta
        title="Create User | Epaper Admin"
        description="Create new user page"
      />
      <div className="w-full">
        <UserRegister />
      </div>
    </>
  );
}
