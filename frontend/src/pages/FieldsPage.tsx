
import { useEffect, useState } from "react";
import type { Farm, Field, FieldRequest, AreaUnit } from "../types";

const FIELDS_API = "/api/fields";
const FARMS_API = "/api/farms";

export default function FieldsPage() {
  const [fields, setFields] = useState<Field[]>([]);
  const [farms, setFarms] = useState<Farm[]>([]);

  const [name, setName] = useState("");
  const [farmId, setFarmId] = useState("");
  const [areaValue, setAreaValue] = useState("");
  const [areaUnit, setAreaUnit] = useState<AreaUnit>("ACRES");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function loadData() {
    try {
      const [fieldResponse, farmResponse] = await Promise.all([
        fetch(FIELDS_API),
        fetch(FARMS_API)
      ]);

      if (!fieldResponse.ok || !farmResponse.ok) {
        throw new Error("Unable to load farms or plots.");
      }

      const [fieldData, farmData] = await Promise.all([
        fieldResponse.json(),
        farmResponse.json()
      ]);

      setFields(fieldData);
      setFarms(farmData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unexpected error.");
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  async function createField(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    const numericArea = Number(areaValue);
    const numericFarmId = Number(farmId);

    if (!name.trim() || !farmId ||
        !Number.isFinite(numericArea) || numericArea <= 0) {
      setError("Enter valid plot details and a positive area.");
      return;
    }

    const payload: FieldRequest = {
      name: name.trim(),
      farmId: numericFarmId,
      areaValue: numericArea,
      areaUnit
    };

    try {
      setLoading(true);

      const response = await fetch(FIELDS_API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const body = await response.json();
        throw new Error(body.message || "Plot creation failed.");
      }

      setName("");
      setFarmId("");
      setAreaValue("");
      setAreaUnit("ACRES");

      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unexpected error.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="p-6">
      <h1 className="text-2xl font-bold">Plot Management</h1>

      <form onSubmit={createField} className="mt-6 space-y-4">
        <div>
          <label htmlFor="plot-name">Plot name</label>
          <input
            id="plot-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="block w-full border p-2"
          />
        </div>

        <div>
          <label htmlFor="plot-farm">Select farm</label>
          <select
            id="plot-farm"
            value={farmId}
            onChange={(e) => setFarmId(e.target.value)}
            required
            className="block w-full border p-2"
          >
            <option value="">Choose a farm</option>
            {farms.map((farm) => (
              <option key={farm.id} value={farm.id}>
                {farm.name} ({farm.areaAcres} acres)
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="plot-area">Plot area</label>
          <div className="flex gap-2">
            <input
              id="plot-area"
              type="number"
              min="0.000001"
              step="any"
              value={areaValue}
              onChange={(e) => setAreaValue(e.target.value)}
              required
              className="w-full border p-2"
            />

            <select
              value={areaUnit}
              onChange={(e) => setAreaUnit(e.target.value as AreaUnit)}
              className="border p-2"
            >
              <option value="ACRES">Acres</option>
              <option value="HECTARES">Hectares</option>
            </select>
          </div>
        </div>

        {error && <p role="alert" className="text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="rounded bg-blue-600 px-4 py-2 text-white"
        >
          {loading ? "Saving..." : "Create Plot"}
        </button>
      </form>

      <section className="mt-8">
        <h2 className="text-xl font-semibold">Your Plots</h2>

        <div className="mt-4 space-y-3">
          {fields.map((field) => {
            const farm = farms.find((item) => item.id === field.farmId);

            return (
              <article key={field.id} className="rounded border p-4">
                <h3 className="font-semibold">{field.name}</h3>
                <p>Farm: {farm?.name ?? field.farmId}</p>
                <p>
                  {field.areaAcres} acres
                  {field.areaHectares != null &&
                    ` (${field.areaHectares} hectares)`}
                </p>
              </article>
            );
          })}

          {fields.length === 0 && <p>No plots created yet.</p>}
        </div>
      </section>
    </main>
  );
}
