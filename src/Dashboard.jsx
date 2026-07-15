import { useEffect } from "react";
import { useState } from "react";
function Dashboard() {
  const [records, setRecords] = useState([]);

  useEffect(() => {
    fetch("YOUR_API_URL")
      .then((res) => res.json())
      .then((data) => setRecords(data));
  }, []);

  return <div>Dashboard</div>;
}

export default Dashboard;
