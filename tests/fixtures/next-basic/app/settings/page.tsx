export default function SettingsPage() {
  return (
    <div>
      <h1>Account settings</h1>
      <form>
        <label>Username</label>
        <input placeholder="Enter your username" />
        <label>Email</label>
        <input placeholder="Enter your email" type="email" />
        <button type="submit">Save changes</button>
      </form>
    </div>
  );
}
