
import { useEffect, useState } from "react";
import { farmService } from "../services";
import { getApiErrorMessage } from "../services/api";
import type { Farm, AreaUnit } from "../types";

const emptyForm = {
  name: "",
  location: "",
  areaValue: "",
};

export default function FarmsPage() {
  const [farms, setFarms] = useState<Farm[]>([]);
  const [name, setName] = useState(emptyForm.name);
  const [location, setLocation] = useState(emptyForm.location);
  const [areaValue, setAreaValue] = useState(emptyForm.areaValue);
  const [areaUnit, setAreaUnit] = useState<AreaUnit>("ACRES");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  // Load farms using the existing authenticated API service.
  async function loadFarms() {
    try {
      setError("");

      const data = await farmService.getAll();

      setFarms(data);
    } catch (err) {
      setError(
        getApiErrorMessage(err, "Unable to load farms.")
      );
    } finally {
      setInitialLoading(false);
    }
  }

  useEffect(() => {
    loadFarms();
  }, []);

  // Create a farm.
  async function createFarm(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();
    setError("");

    const numericArea = Number(areaValue);

    if (!name.trim()) {
      setError("Please enter a farm name.");
      return;
    }

    if (!location.trim()) {
      setError("Please enter the farm location.");
      return;
    }

    if (
      !Number.isFinite(numericArea) ||
      numericArea <= 0
    ) {
      setError("Farm area must be a number greater than zero.");
      return;
    }

    try {
      setLoading(true);

      const payload: Partial<Farm> & {
        areaValue: number;
        areaUnit: AreaUnit;
      } = {
        name: name.trim(),
        location: location.trim(),
        areaValue: numericArea,
        areaUnit,
      };

      await farmService.create(payload);

      // Clear form after successful creation.
      setName("");
      setLocation("");
      setAreaValue("");
      setAreaUnit("ACRES");

      // Refresh farm list.
      await loadFarms();

    } catch (err) {
      setError(
        getApiErrorMessage(err, "Farm creation failed.")
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="space-y-6 p-6">

      {/* Page heading */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Farm Management
        </h1>

        <p className="mt-1 text-sm text-gray-500">
          Register and manage your agricultural farms.
        </p>
      </div>

      {/* Create farm form */}
      <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">

        <h2 className="mb-5 text-lg font-semibold text-gray-900">
          Register New Farm
        </h2>

        <form
          onSubmit={createFarm}
          className="space-y-4"
        >

          {/* Farm name */}
          <div>
            <label
              htmlFor="farm-name"
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              Farm Name
            </label>

            <input
              id="farm-name"
              type="text"
              value={name}
              onChange={(event) =>
                setName(event.target.value)
              }
              placeholder="Enter farm name"
              required
              className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
            />
          </div>

          {/* Farm location */}
          <div>
            <label
              htmlFor="farm-location"
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              Location
            </label>

            <input
              id="farm-location"
              type="text"
              value={location}
              onChange={(event) =>
                setLocation(event.target.value)
              }
              placeholder="Enter farm location"
              required
              className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
            />
          </div>

          {/* Farm area */}
          <div>
            <label
              htmlFor="farm-area"
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              Farm Area
            </label>

            <div className="flex gap-3">

              <input
                id="farm-area"
                type="number"
                min="0.000001"
                step="any"
                value={areaValue}
                onChange={(event) =>
                  setAreaValue(event.target.value)
                }
                placeholder="Enter area"
                required
                className="min-w-0 flex-1 rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
              />

              <select
                value={areaUnit}
                onChange={(event) =>
                  setAreaUnit(event.target.value as AreaUnit)
                }
                className="rounded-lg border border-gray-300 bg-white px-3 py-2 outline-none focus:border-emerald-500"
              >
                <option value="ACRES">Acres</option>
                <option value="HECTARES">Hectares</option>
              </select>

            </div>
          </div>

          {/* Error message */}
          {error && (
            <div
              role="alert"
              className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700"
            >
              {error}
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="rounded-lg bg-emerald-600 px-5 py-2.5 font-medium text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Creating Farm..." : "Create Farm"}
          </button>

        </form>
      </section>

      {/* Farm list */}
      <section>

        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">
            Your Farms
          </h2>

          <span className="text-sm text-gray-500">
            {farms.length} registered
          </span>
        </div>

        {initialLoading ? (
          <p className="text-sm text-gray-500">
            Loading farms...
          </p>
        ) : farms.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-300 bg-white p-8 text-center">
            <p className="font-medium text-gray-700">
              No farms registered yet.
            </p>

            <p className="mt-1 text-sm text-gray-500">
              Create your first farm using the form above.
            </p>
          </div>
        ) : (

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">

            {farms.map((farm) => (
              <article
                key={farm.id}
                className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition hover:shadow-md"
              >

                <h3 className="text-lg font-semibold text-gray-900">
                  {farm.name}
                </h3>

                <p className="mt-1 text-sm text-gray-500">
                  {farm.location}
                </p>

                <div className="mt-4 border-t border-gray-100 pt-4">

                  <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                    Farm Area
                  </p>

                  <p className="mt-1 text-xl font-semibold text-emerald-700">
                    {farm.areaAcres} acres
                  </p>

                  {farm.areaHectares != null && (
                    <p className="mt-1 text-sm text-gray-500">
                      {farm.areaHectares} hectares
                    </p>
                  )}

                </div>

              </article>
            ))}

          </div>
        )}

      </section>

    </main>
  );
}
