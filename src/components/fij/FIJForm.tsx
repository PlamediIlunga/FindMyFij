'use client';

import { useState } from 'react';
import { FIJ_CATEGORIES, type Fij, type FijInput } from '@/types/fij';
import { CANADIAN_PROVINCES, getCitiesForProvince } from '@/data/canadaLocations';
import { SelectOrCustom } from './SelectOrCustom';
import styles from './FIJForm.module.scss';

interface FIJFormProps {
  initialData?: Fij;
  submitLabel?: string;
  onSubmit: (input: FijInput) => Promise<void>;
}

type GeocodeStatus = 'idle' | 'loading' | 'success' | 'error';

export function FIJForm({ initialData, submitLabel = 'Enregistrer', onSubmit }: FIJFormProps) {
  const [name, setName] = useState(initialData?.name ?? '');
  const [category, setCategory] = useState<Fij['category']>(
    initialData?.category ?? FIJ_CATEGORIES[0]!
  );
  const [address, setAddress] = useState(initialData?.address ?? '');
  const [city, setCity] = useState(initialData?.city ?? '');
  const [province, setProvince] = useState(initialData?.province ?? '');
  const [postalCode, setPostalCode] = useState(initialData?.postalCode ?? '');
  const [country, setCountry] = useState(initialData?.country ?? 'Canada');

  const [latitude, setLatitude] = useState(initialData ? String(initialData.latitude) : '');
  const [longitude, setLongitude] = useState(initialData ? String(initialData.longitude) : '');
  const [geocodeStatus, setGeocodeStatus] = useState<GeocodeStatus>('idle');
  const [geocodeMessage, setGeocodeMessage] = useState<string | null>(null);
  const [isApproximate, setIsApproximate] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSucceeded, setSubmitSucceeded] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  async function tryGeocode(
    query: string
  ): Promise<{ latitude: number; longitude: number; displayName: string } | null> {
    const response = await fetch('/api/geocoding', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        address: query,
        countryCode: country.trim().toLowerCase() === 'canada' ? 'ca' : undefined,
      }),
    });
    if (!response.ok) return null;
    return response.json();
  }

  async function handleGeocode() {
    if (!address.trim() || !city.trim()) {
      setGeocodeStatus('error');
      setGeocodeMessage("Renseignez au moins l'adresse et la ville avant de géocoder.");
      return;
    }

    setGeocodeStatus('loading');
    setGeocodeMessage(null);
    setIsApproximate(false);

    const attempts: { query: string; approximate: boolean }[] = [
      { query: `${address}, ${city}, ${province} ${postalCode}`.trim(), approximate: false },
      { query: `${address}, ${city}, ${province}`.trim(), approximate: false },
      { query: `${city}, ${province}, ${country}`.trim(), approximate: true },
    ];

    try {
      for (const attempt of attempts) {
        const result = await tryGeocode(attempt.query);
        if (result) {
          setLatitude(String(result.latitude));
          setLongitude(String(result.longitude));
          setGeocodeStatus('success');
          setIsApproximate(attempt.approximate);
          setGeocodeMessage(
            attempt.approximate
              ? `Position approximative (centre de ${city}) — ajustez les coordonnées ci-dessous si besoin.`
              : result.displayName
          );
          return;
        }
      }

      setGeocodeStatus('error');
      setGeocodeMessage(
        'Adresse introuvable, même approximativement. Renseignez la latitude/longitude manuellement ci-dessous (ex: via Google Maps, clic droit sur le point → coordonnées affichées).'
      );
    } catch {
      setGeocodeStatus('error');
      setGeocodeMessage('Impossible de contacter le service de géocodage.');
    }
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setFormError(null);

    const parsedLatitude = parseFloat(latitude);
    const parsedLongitude = parseFloat(longitude);

    if (!Number.isFinite(parsedLatitude) || !Number.isFinite(parsedLongitude)) {
      setFormError(
        "Veuillez géocoder l'adresse ou renseigner manuellement une latitude/longitude valides."
      );
      return;
    }
    if (parsedLatitude < -90 || parsedLatitude > 90 || parsedLongitude < -180 || parsedLongitude > 180) {
      setFormError('Latitude/longitude hors des bornes valides.');
      return;
    }
    if (!name.trim() || !address.trim() || !city.trim() || !province.trim() || !postalCode.trim()) {
      setFormError('Veuillez remplir tous les champs obligatoires.');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({
        name: name.trim(),
        category,
        address: address.trim(),
        city: city.trim(),
        province: province.trim(),
        postalCode: postalCode.trim(),
        country: country.trim(),
        latitude: parsedLatitude,
        longitude: parsedLongitude,
      });
      // Bref retour visuel positif avant que le parent ne redirige (le
      // bouton passe au vert avec une confirmation), pour que l'action
      // se sente réactive même si la navigation qui suit est quasi
      // instantanée.
      setSubmitSucceeded(true);
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Une erreur est survenue.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <div className={styles.field}>
        <label className={styles.label} htmlFor="name">Nom de la FIJ</label>
        <input
          id="name"
          className={styles.input}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="FIJ Espoir"
          required
        />
      </div>

      <div className={styles.field}>
        <label className={styles.label} htmlFor="category">Catégorie</label>
        <select
          id="category"
          className={styles.select}
          value={category}
          onChange={(e) => setCategory(e.target.value as Fij['category'])}
        >
          {FIJ_CATEGORIES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>

      <div className={styles.field}>
        <label className={styles.label} htmlFor="address">Adresse</label>
        <input
          id="address"
          className={styles.input}
          value={address}
          onChange={(e) => {
            setAddress(e.target.value);
            setGeocodeStatus('idle');
          }}
          placeholder="123 rue Principale"
          required
        />
      </div>

      <div className={styles.row}>
        <SelectOrCustom
          label="Province"
          value={province}
          onChange={(newProvince: string) => {
            setProvince(newProvince);
            setCity('');
            setGeocodeStatus('idle');
          }}
          options={CANADIAN_PROVINCES.map((p) => p.code)}
          otherLabel="Autre province/territoire"
          placeholder="Ex: QC"
          required
        />
        <SelectOrCustom
          label="Ville"
          value={city}
          onChange={(newCity: string) => {
            setCity(newCity);
            setGeocodeStatus('idle');
          }}
          options={getCitiesForProvince(province)}
          otherLabel="Autre ville — saisir manuellement"
          placeholder="Ex: Gatineau"
          disabled={!province}
          required
        />
      </div>

      <div className={styles.row}>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="postalCode">Code postal</label>
          <input
            id="postalCode"
            className={styles.input}
            value={postalCode}
            onChange={(e) => setPostalCode(e.target.value)}
            placeholder="J8X 1A1"
            required
          />
        </div>
        <SelectOrCustom
          label="Pays"
          value={country}
          onChange={setCountry}
          options={['Canada']}
          otherLabel="Autre pays"
          placeholder="Ex: Canada"
          required
        />
      </div>

      <div className={styles.geocodeRow}>
        <button
          type="button"
          className={styles.geocodeButton}
          onClick={handleGeocode}
          disabled={geocodeStatus === 'loading'}
        >
          {geocodeStatus === 'loading' ? 'Géocodage…' : "📍 Géocoder l'adresse"}
        </button>
        <span
          className={`${styles.geocodeStatus} ${
            geocodeStatus === 'success' && !isApproximate ? styles.geocodeSuccess : ''
          } ${geocodeStatus === 'success' && isApproximate ? styles.geocodeWarning : ''} ${
            geocodeStatus === 'error' ? styles.geocodeError : ''
          }`}
        >
          {geocodeStatus === 'idle' && 'Coordonnées non calculées.'}
          {geocodeStatus === 'success' && geocodeMessage}
          {geocodeStatus === 'error' && geocodeMessage}
        </span>
      </div>

      <div className={styles.row}>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="latitude">Latitude</label>
          <input
            id="latitude"
            className={styles.input}
            type="number"
            step="0.000001"
            value={latitude}
            onChange={(e) => setLatitude(e.target.value)}
            placeholder="45.4290"
          />
        </div>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="longitude">Longitude</label>
          <input
            id="longitude"
            className={styles.input}
            type="number"
            step="0.000001"
            value={longitude}
            onChange={(e) => setLongitude(e.target.value)}
            placeholder="-75.7173"
          />
        </div>
      </div>
      <p className={styles.hint}>
        Rempli automatiquement par le géocodage, mais modifiable à la main si l&apos;adresse n&apos;est
        pas trouvée ou si la position doit être affinée (clic droit sur un point dans Google Maps
        pour copier ses coordonnées).
      </p>

      {formError && <p className={styles.formError}>{formError}</p>}

      <button
        type="submit"
        className={`${styles.submitButton} ${submitSucceeded ? styles.submitButtonSuccess : ''}`}
        disabled={isSubmitting || submitSucceeded}
      >
        {submitSucceeded ? '✓ Enregistré' : isSubmitting ? 'Enregistrement…' : submitLabel}
      </button>
    </form>
  );
}