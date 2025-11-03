/**
 * JobSites Page (Supervisor Only)
 *
 * Manage job sites: create, edit, view, and deactivate
 * Set GPS coordinates and verification radius
 */

import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  getAllJobSites,
  createJobSite,
  updateJobSite,
  deactivateJobSite,
  activateJobSite,
  validateJobSite,
} from "../services/jobSites";
import { getCurrentLocation, formatRadius } from "../services/geolocation";
import type { JobSite, NewJobSite } from "../types/timeTracking";
import { useToast } from "../hooks/useToast";
import Header from "../components/ui/Header";
import Button from "../components/ui/Button";
import LoadingSpinner from "../components/ui/LoadingSpinner";
import EmptyState from "../components/ui/EmptyState";
import ConfirmDialog from "../components/ui/ConfirmDialog";
import { auth } from "../firebase";
import InteractiveMap from "../components/maps/InteractiveMap";

export default function JobSites() {
  const [sites, setSites] = useState<JobSite[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingSite, setEditingSite] = useState<JobSite | null>(null);
  const [siteToDeactivate, setSiteToDeactivate] = useState<JobSite | null>(
    null
  );
  const [showInactive, setShowInactive] = useState(false);
  const toast = useToast();

  const loadSites = useCallback(async () => {
    try {
      const data = await getAllJobSites(!showInactive);
      setSites(data);
    } catch (error) {
      console.error("Error loading job sites:", error);
      toast.error("Failed to load job sites");
    } finally {
      setLoading(false);
    }
  }, [showInactive, toast]);

  useEffect(() => {
    loadSites();
  }, [loadSites]);

  function handleAddNew() {
    setEditingSite(null);
    setShowForm(true);
  }

  function handleEdit(site: JobSite) {
    setEditingSite(site);
    setShowForm(true);
  }

  async function handleDeactivate(site: JobSite) {
    try {
      await deactivateJobSite(site.id);
      toast.success(`${site.name} deactivated`);
      loadSites();
      setSiteToDeactivate(null);
    } catch (error) {
      console.error("Error deactivating site:", error);
      toast.error("Failed to deactivate site");
    }
  }

  async function handleActivate(site: JobSite) {
    try {
      await activateJobSite(site.id);
      toast.success(`${site.name} activated`);
      loadSites();
    } catch (error) {
      console.error("Error activating site:", error);
      toast.error("Failed to activate site");
    }
  }

  if (loading) {
    return (
      <div className="pb-20 min-h-screen bg-slate-50">
        <Header title="Job Sites" subtitle="Loading sites..." />
        <div className="flex items-center justify-center py-20">
          <LoadingSpinner />
        </div>
      </div>
    );
  }

  return (
    <div className="pb-20 min-h-screen bg-slate-50">
      <Header
        title="Job Sites"
        subtitle={`${sites.length} ${sites.length === 1 ? "site" : "sites"}`}
      />

      <div className="max-w-2xl mx-auto p-4 space-y-6">
        {/* Actions */}
        <div className="flex gap-3">
          <Button onClick={handleAddNew} className="flex-1" size="lg">
            + Add New Site
          </Button>
          <button
            onClick={() => setShowInactive(!showInactive)}
            className="px-4 py-2 rounded-xl border-2 border-slate-300 text-slate-700 hover:bg-slate-50 font-semibold text-sm transition-colors"
          >
            {showInactive ? "Hide" : "Show"} Inactive
          </button>
        </div>

        {/* Sites List */}
        {sites.length === 0 ? (
          <EmptyState
            icon="ðŸ“"
            title="No job sites"
            description="Add your first job site to get started."
          />
        ) : (
          <div className="space-y-3">
            {sites.map((site) => (
              <div
                key={site.id}
                className={`bg-white rounded-2xl shadow-sm border-2 p-5 ${
                  site.active
                    ? "border-slate-200"
                    : "border-slate-300 opacity-60"
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-lg text-slate-900">
                        {site.name}
                      </h3>
                      {!site.active && (
                        <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-200 text-slate-700">
                          Inactive
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-slate-600 mt-1">
                      {site.address}
                    </p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-2 mt-4">
                  <Link
                    to={`/job-sites/${site.id}/history`}
                    className="flex-1 px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-semibold text-sm transition-colors text-center"
                  >
                    View Personnel
                  </Link>
                  <button
                    onClick={() => handleEdit(site)}
                    className="flex-1 px-4 py-2 rounded-xl bg-blue-500 hover:bg-blue-600 text-white font-semibold text-sm transition-colors"
                  >
                    Edit
                  </button>
                  {site.active ? (
                    <button
                      onClick={() => setSiteToDeactivate(site)}
                      className="flex-1 px-4 py-2 rounded-xl bg-slate-500 hover:bg-slate-600 text-white font-semibold text-sm transition-colors"
                    >
                      Deactivate
                    </button>
                  ) : (
                    <button
                      onClick={() => handleActivate(site)}
                      className="flex-1 px-4 py-2 rounded-xl bg-green-500 hover:bg-green-600 text-white font-semibold text-sm transition-colors"
                    >
                      Activate
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Site Form Modal */}
      {showForm && (
        <SiteFormModal
          site={editingSite}
          onClose={() => {
            setShowForm(false);
            setEditingSite(null);
          }}
          onSave={() => {
            setShowForm(false);
            setEditingSite(null);
            loadSites();
          }}
        />
      )}

      {/* Deactivate Confirmation */}
      {siteToDeactivate && (
        <ConfirmDialog
          isOpen={true}
          title="Deactivate Job Site"
          message={`Are you sure you want to deactivate "${siteToDeactivate.name}"? It will no longer appear in the clock-in list.`}
          confirmLabel="Deactivate"
          cancelLabel="Cancel"
          variant="warning"
          onConfirm={() => handleDeactivate(siteToDeactivate)}
          onCancel={() => setSiteToDeactivate(null)}
        />
      )}
    </div>
  );
}

// Site Form Modal Component
interface SiteFormModalProps {
  site: JobSite | null;
  onClose: () => void;
  onSave: () => void;
}

function SiteFormModal({ site, onClose, onSave }: SiteFormModalProps) {
  const [name, setName] = useState(site?.name || "");
  const [address, setAddress] = useState(site?.address || "");
  const [latitude, setLatitude] = useState(
    site?.location.lat.toString() || ""
  );
  const [longitude, setLongitude] = useState(
    site?.location.lng.toString() || ""
  );
  const [radius, setRadius] = useState(
    site?.radius.toString() || "328"
  );
  const [useMapMode, setUseMapMode] = useState(false);
  const [gettingLocation, setGettingLocation] = useState(false);
  const [saving, setSaving] = useState(false);
  const toast = useToast();

  async function handleGetCurrentLocation() {
    setGettingLocation(true);
    try {
      const location = await getCurrentLocation();
      if (location.denied || location.error) {
        toast.error("Unable to get location. Please enter manually.");
      } else {
        setLatitude(location.coords.lat.toFixed(6));
        setLongitude(location.coords.lng.toFixed(6));
        toast.success("Location captured!");
      }
    } catch (error) {
      console.error("Error getting location:", error);
      toast.error("Failed to get location");
    } finally {
      setGettingLocation(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    try {
      const data: Partial<NewJobSite> = {
        name: name.trim(),
        address: address.trim(),
        location: {
          lat: parseFloat(latitude),
          lng: parseFloat(longitude),
        },
        radius: parseInt(radius, 10),
      };

      // Validate
      validateJobSite(data);

      if (site) {
        // Update existing
        await updateJobSite(site.id, data);
        toast.success(`${name} updated`);
      } else {
        // Create new
        const user = auth.currentUser;
        if (!user) throw new Error("Not authenticated");

        await createJobSite({
          ...data,
          active: true,
          createdBy: user.uid,
        } as NewJobSite);
        toast.success(`${name} created`);
      }

      onSave();
    } catch (error) {
      console.error("Error saving site:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to save site"
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <h2 className="text-2xl font-bold text-slate-900">
            {site ? "Edit Job Site" : "Add New Job Site"}
          </h2>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Site Name <span className="text-error">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="e.g., Downtown Construction"
              className="w-full rounded-xl border-2 border-slate-200 p-3 text-sm shadow-sm focus:border-orange-500 focus:outline-none focus:ring-4 focus:ring-orange-100"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Address <span className="text-error">*</span>
            </label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              required
              placeholder="123 Main St, City, State"
              className="w-full rounded-xl border-2 border-slate-200 p-3 text-sm shadow-sm focus:border-orange-500 focus:outline-none focus:ring-4 focus:ring-orange-100"
            />
          </div>

          {/* Toggle between Map and Manual Entry */}
          <div className="flex items-center gap-2 bg-slate-50 rounded-xl p-3 border border-slate-200">
            <button
              type="button"
              onClick={() => setUseMapMode(false)}
              className={`flex-1 py-2 px-4 rounded-lg font-semibold text-sm transition-all ${
                !useMapMode
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Manual Entry
            </button>
            <button
              type="button"
              onClick={() => setUseMapMode(true)}
              className={`flex-1 py-2 px-4 rounded-lg font-semibold text-sm transition-all ${
                useMapMode
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              ðŸ“ Use Map
            </button>
          </div>

          {useMapMode ? (
            /* Interactive Map Mode */
            <InteractiveMap
              initialLocation={
                latitude && longitude
                  ? { lat: parseFloat(latitude) || 0, lng: parseFloat(longitude) || 0 }
                  : undefined
              }
              initialRadius={parseInt(radius) || 328}
              onLocationChange={(coords) => {
                setLatitude(coords.lat.toFixed(6));
                setLongitude(coords.lng.toFixed(6));
              }}
              onRadiusChange={(newRadius) => {
                setRadius(newRadius.toString());
              }}
              height="350px"
            />
          ) : (
            /* Manual Entry Mode */
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Latitude <span className="text-error">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.000001"
                    value={latitude}
                    onChange={(e) => setLatitude(e.target.value)}
                    required
                    placeholder="40.712776"
                    className="w-full rounded-xl border-2 border-slate-200 p-3 text-sm shadow-sm focus:border-orange-500 focus:outline-none focus:ring-4 focus:ring-orange-100 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Longitude <span className="text-error">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.000001"
                    value={longitude}
                    onChange={(e) => setLongitude(e.target.value)}
                    required
                    placeholder="-74.005974"
                    className="w-full rounded-xl border-2 border-slate-200 p-3 text-sm shadow-sm focus:border-orange-500 focus:outline-none focus:ring-4 focus:ring-orange-100 font-mono"
                  />
                </div>
              </div>

              <Button
                type="button"
                onClick={handleGetCurrentLocation}
                loading={gettingLocation}
                className="w-full bg-blue-500 hover:bg-blue-600"
                size="sm"
              >
                {gettingLocation ? "Getting Location..." : "ðŸ“ Use Current Location"}
              </Button>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Verification Radius <span className="text-error">*</span>
                </label>
                <div className="flex items-center gap-2 mb-1">
                  <input
                    type="number"
                    min="164"
                    max="16404"
                    value={radius}
                    onChange={(e) => setRadius(e.target.value)}
                    required
                    className="flex-1 rounded-xl border-2 border-slate-200 p-3 text-sm shadow-sm focus:border-orange-500 focus:outline-none focus:ring-4 focus:ring-orange-100"
                  />
                  <span className="text-sm text-slate-600 font-mono min-w-[80px]">
                    {formatRadius(parseInt(radius) || 328)}
                  </span>
                </div>
                <p className="mt-1 text-xs text-slate-500">
                  Minimum 164ft, recommended 328ft
                </p>
              </div>
            </>
          )}

          <div className="flex gap-3 pt-2">
            <Button
              type="submit"
              loading={saving}
              disabled={saving}
              className="flex-1"
              size="lg"
            >
              {saving ? "Saving..." : site ? "Update Site" : "Create Site"}
            </Button>
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 rounded-xl border-2 border-slate-300 text-slate-700 hover:bg-slate-50 font-semibold text-sm transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

