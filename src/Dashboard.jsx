import Navbar from "../components/Navbar";
import StatsCard from "../components/StatsCard";
import DataTable from "../components/DataTable";
import data from "../data";

function Dashboard() {
  const total = data.length;

  const valid = data.filter((item) => item.status === "valid").length;

  const violated = data.filter((item) => item.status === "violated").lenght;

  return (
    <div>
      <Navbar />

      <div>
        <div className="p-6">
          <StatsCard title="Total Records" value={total} />

          <StatsCard title="Validated" value={valid} />

          <StatsCard title="Violated" value={violated} />
        </div>

        <DataTable records={data} />
      </div>
    </div>
  );
}

export default Dashboard;
