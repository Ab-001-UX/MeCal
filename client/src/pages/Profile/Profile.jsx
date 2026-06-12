import React, { useState, useEffect } from 'react'
import axios from 'axios'
import styles from './Profile.module.css'
import { useNavigate } from 'react-router-dom'
import { useUserStore } from '../../store/userStore'
import { useTrackingStore } from '../../store/trackingStore'
import { useUiStore } from '../../store/uiStore'
import { updateProfile } from '../../services/auth.service.js'
import { useTranslation } from 'react-i18next'
import { ArrowLeft } from 'lucide-react'
import ProfileSkeleton from './ProfileSkeleton'

export default function Profile() {
  const { user: storeUser, setUser } = useUserStore()
  const { language, setLanguage } = useUiStore()
  const { t } = useTranslation()
  const currentCulture = language || localStorage.getItem('mecal_language') || 'en'
  const [user, setLocalUser] = useState(storeUser)
  const [loading, setLoading] = useState(!storeUser)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({})
  const navigate = useNavigate()

  useEffect(() => {
    fetchProfile()
  }, [])

  const fetchProfile = async () => {
    try {
      const response = await axios.get('/api/auth/me', { withCredentials: true })
      if (response.data.success) {
        setLocalUser(response.data.data)
        setUser(response.data.data)
      }
    } catch (err) {
      console.error('Failed to fetch profile:', err)
    } finally {
      setLoading(false)
    }
  }

  const openEdit = () => {
    setForm({
      name: user?.name || '',
      weight: user?.weight ?? '',
      targetWeight: user?.targetWeight ?? '',
      height: user?.height ?? '',
      age: user?.age ?? '',
      unitPreference: user?.unitPreference || 'metric',
      gender: user?.gender || '',
      goal: user?.goal || 'maintain',
      targetDuration: user?.targetDuration || '',
      country: user?.country || '',
      tribe: user?.tribe || '',
      lifestyleType: user?.lifestyleType || 'mixed',
      budgetPreference: user?.budgetPreference || 'moderate',
      activityLevel: user?.activityLevel || 'moderate',
      waterPreference: user?.waterPreference || 'sachet',
      allergies: Array.isArray(user?.allergies) ? user.allergies : [],
      otherAllergies: user?.otherAllergies || '',
      language: localStorage.getItem('mecal_language') || 'en',
      calorieGoal: user?.calorieGoal ?? '',
      waterGoal: user?.waterGoal ?? '',
      stepGoal: user?.stepGoal ?? ''
    })
    setEditing(true)
  }

  const handleSave = async () => {
    // Add validation before saving
    if (form.goal === 'lose' || form.goal === 'gain') {
      if (!form.targetWeight) {
        alert(form.language === 'fr' ? 'Veuillez saisir un poids cible.' : 'Please enter a target weight.')
        return
      }
      const currentW = parseFloat(form.weight)
      const targetW = parseFloat(form.targetWeight)
      if (form.goal === 'lose' && targetW >= currentW) {
        alert(form.language === 'fr' ? 'Le poids cible doit être inférieur au poids actuel.' : 'Target weight must be less than current weight.')
        return
      }
      if (form.goal === 'gain' && targetW <= currentW) {
        alert(form.language === 'fr' ? 'Le poids cible doit être supérieur au poids actuel.' : 'Target weight must be greater than current weight.')
        return
      }
    }

    setSaving(true)
    try {
      if (form.language) {
        setLanguage(form.language)
      }

      const response = await updateProfile({
        ...form,
        age: form.age ? parseInt(form.age, 10) : null,
        weight: form.weight ? parseFloat(form.weight) : null,
        targetWeight: form.targetWeight ? parseFloat(form.targetWeight) : null,
        height: form.height ? parseFloat(form.height) : null,
        calorieGoal: form.calorieGoal ? parseInt(form.calorieGoal, 10) : null,
        waterGoal: form.waterGoal ? parseInt(form.waterGoal, 10) : null,
        stepGoal: form.stepGoal ? parseInt(form.stepGoal, 10) : null
      })
      if (response.data.success) {
        setLocalUser(response.data.data)
        setUser(response.data.data)
        setEditing(false)
      }
    } catch (err) {
      console.error('Update failed:', err)
      alert(currentCulture === 'fr' ? 'Impossible d\'enregistrer le profil. Veuillez réessayer.' : 'Could not save profile. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const handleLogout = async () => {
    if (!window.confirm(currentCulture === 'fr' ? 'Êtes-vous sûr de vouloir vous déconnecter ?' : 'Are you sure you want to log out?')) return
    try {
      const response = await axios.post('/api/auth/logout', {}, { withCredentials: true })
      if (response.data.success) {
        setUser(null)
        useTrackingStore.getState().clearTrackingData()
        navigate('/login')
      }
    } catch (err) {
      console.error('Logout failed:', err)
    }
  }

  const displayUser = user || storeUser

  if (loading) return <ProfileSkeleton />
  if (!displayUser) return <div className={styles.error}>{currentCulture === 'fr' ? 'Impossible de charger le profil.' : 'Failed to load profile.'}</div>

  const formatHeight = (heightVal) => {
    if (!heightVal) return '-'
    if (displayUser?.unitPreference === 'imperial' && heightVal < 10) {
      const feet = Math.floor(heightVal)
      const inches = Math.round((heightVal - feet) * 12)
      return `${feet}' ${inches}"`
    }
    return `${heightVal} cm`
  }

  const allergyList = Array.isArray(displayUser.allergies)
    ? displayUser.allergies.filter((a) => a && a !== 'none')
    : []

  if (editing) {
    return (
      <div className={`fade-in ${styles.container}`}>
        <header className={styles.editHeader}>
          <button type="button" className={styles.backBtn} onClick={() => setEditing(false)}>
            <ArrowLeft size={24} />
          </button>
          <h1 className={styles.editTitle}>{form.language === 'fr' ? 'Modifier le profil' : 'Edit Profile'}</h1>
          <div style={{ width: '40px' }}></div>
        </header>

        <form className={styles.editForm} onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
          <div className={styles.editSection}>
            <h3 className={styles.editSectionTitle}>{form.language === 'fr' ? 'Informations personnelles' : 'Personal Information'}</h3>
            
            <div className={styles.formGroup}>
              <label>{form.language === 'fr' ? 'Surnom' : 'Nickname'}</label>
              <input 
                type="text"
                value={form.name} 
                onChange={(e) => setForm({ ...form, name: e.target.value })} 
                required 
              />
            </div>

            <div className={styles.formGroup}>
              <label>{form.language === 'fr' ? 'Langue de l\'application' : 'App Language'}</label>
              <select 
                value={form.language} 
                onChange={(e) => setForm({ ...form, language: e.target.value })}
              >
                <option value="en">English</option>
                <option value="fr">Français</option>
              </select>
            </div>

            <div className={styles.formGroup}>
              <label>{form.language === 'fr' ? 'Genre' : 'Gender'}</label>
              <select 
                value={form.gender} 
                onChange={(e) => setForm({ ...form, gender: e.target.value })}
              >
                <option value="">{form.language === 'fr' ? 'Sélectionner le genre...' : 'Select gender...'}</option>
                <option value="Male">{form.language === 'fr' ? 'Homme' : 'Male'}</option>
                <option value="Female">{form.language === 'fr' ? 'Femme' : 'Female'}</option>
                <option value="Other">{form.language === 'fr' ? 'Autre' : 'Other'}</option>
              </select>
            </div>

            <div className={styles.formGroup}>
              <label>{form.language === 'fr' ? 'Âge' : 'Age'}</label>
              <input 
                type="number" 
                value={form.age} 
                onChange={(e) => setForm({ ...form, age: e.target.value })} 
              />
            </div>
          </div>

          <div className={styles.editSection}>
            <h3 className={styles.editSectionTitle}>{form.language === 'fr' ? 'Métriques corporelles' : 'Body Metrics'}</h3>
            
            <div className={styles.formGroup}>
              <label>{form.language === 'fr' ? 'Système d\'unités' : 'Unit System'}</label>
              <div className={styles.unitToggleRow}>
                <button
                  type="button"
                  className={`${styles.toggleButton} ${form.unitPreference === 'metric' ? styles.toggleActive : ''}`}
                  onClick={() => setForm({ ...form, unitPreference: 'metric' })}
                >
                  cm / kg
                </button>
                <button
                  type="button"
                  className={`${styles.toggleButton} ${form.unitPreference === 'imperial' ? styles.toggleActive : ''}`}
                  onClick={() => setForm({ ...form, unitPreference: 'imperial' })}
                >
                  ft / lbs
                </button>
              </div>
            </div>

            <div className={styles.formGroup}>
              <label>
                {form.language === 'fr' ? 'Poids' : 'Weight'}{' '}
                ({form.unitPreference === 'imperial' ? 'lbs' : 'kg'})
              </label>
              <input 
                type="number" 
                step="any"
                value={form.weight} 
                onChange={(e) => setForm({ ...form, weight: e.target.value })} 
              />
            </div>

            <div className={styles.formGroup}>
              <label>
                {form.language === 'fr' ? 'Taille' : 'Height'}{' '}
                ({form.unitPreference === 'imperial' ? 'ft' : 'cm'})
              </label>
              <input 
                type="number" 
                step="any"
                value={form.height} 
                onChange={(e) => setForm({ ...form, height: e.target.value })} 
              />
            </div>
          </div>

          <div className={styles.editSection}>
            <h3 className={styles.editSectionTitle}>{form.language === 'fr' ? 'Objectifs & Préférences' : 'Goals & Preferences'}</h3>

            <div className={styles.formGroup}>
              <label>{form.language === 'fr' ? 'Objectif' : 'Goal'}</label>
              <select 
                value={form.goal} 
                onChange={(e) => setForm({ ...form, goal: e.target.value })}
              >
                <option value="lose">{form.language === 'fr' ? 'Perdre du poids' : 'Lose weight'}</option>
                <option value="gain">{form.language === 'fr' ? 'Prendre du poids' : 'Gain weight'}</option>
                <option value="maintain">{form.language === 'fr' ? 'Maintenir' : 'Maintain'}</option>
              </select>
            </div>

            <div className={styles.formGroup}>
              <label>{form.language === 'fr' ? 'Durée cible' : 'Timeline'}</label>
              <input 
                type="text" 
                value={form.targetDuration} 
                onChange={(e) => setForm({ ...form, targetDuration: e.target.value })}
                placeholder="e.g. 3 months, 6 months"
              />
            </div>

            <div className={styles.formGroup}>
              <label>
                {form.language === 'fr' ? 'Poids cible' : 'Target Weight'}{' '}
                ({form.unitPreference === 'imperial' ? 'lbs' : 'kg'})
              </label>
              <input 
                type="number" 
                step="any"
                value={form.targetWeight} 
                onChange={(e) => setForm({ ...form, targetWeight: e.target.value })}
                placeholder={form.language === 'fr' ? 'ex. 60' : 'e.g. 60'}
              />
            </div>

            <div className={styles.formGroup}>
              <label>{form.language === 'fr' ? 'Pays' : 'Country'}</label>
              <select 
                value={form.country} 
                onChange={(e) => setForm({ ...form, country: e.target.value })}
              >
                <option value="">Select country...</option>
                <option value="Nigeria">Nigeria</option>
                <option value="Ghana">Ghana</option>
                <option value="Senegal">Senegal</option>
                <option value="Ivory Coast">Ivory Coast</option>
                <option value="Gambia">Gambia</option>
                <option value="Sierra Leone">Sierra Leone</option>
                <option value="Liberia">Liberia</option>
                <option value="Mali">Mali</option>
                <option value="Niger">Niger</option>
                <option value="Burkina Faso">Burkina Faso</option>
                <option value="Benin">Benin</option>
                <option value="Togo">Togo</option>
                <option value="Guinea">Guinea</option>
                <option value="Mauritania">Mauritania</option>
                <option value="Cape Verde">Cape Verde</option>
                <option value="Guinea-Bissau">Guinea-Bissau</option>
              </select>
            </div>

            <div className={styles.formGroup}>
              <label>{form.language === 'fr' ? 'Tribu' : 'Tribe'}</label>
              <select 
                value={form.tribe} 
                onChange={(e) => setForm({ ...form, tribe: e.target.value })}
              >
                <option value="">Select tribe...</option>
                <option value="Yoruba">Yoruba</option>
                <option value="Igbo">Igbo</option>
                <option value="Hausa">Hausa</option>
                <option value="Fulani">Fulani</option>
                <option value="Akan">Akan</option>
                <option value="Wolof">Wolof</option>
                <option value="Ewe">Ewe</option>
                <option value="Ga">Ga</option>
                <option value="Mandinka">Mandinka</option>
                <option value="Mende">Mende</option>
                <option value="Temne">Temne</option>
                <option value="Bambara">Bambara</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div className={styles.formGroup}>
              <label>{form.language === 'fr' ? 'Mode de vie' : 'Lifestyle'}</label>
              <select 
                value={form.lifestyleType} 
                onChange={(e) => setForm({ ...form, lifestyleType: e.target.value })}
              >
                <option value="student">{form.language === 'fr' ? 'Étudiant' : 'Student'}</option>
                <option value="professional">{form.language === 'fr' ? 'Professionnel' : 'Professional'}</option>
                <option value="mixed">{form.language === 'fr' ? 'Mixte' : 'Mixed'}</option>
              </select>
            </div>

            <div className={styles.formGroup}>
              <label>{form.language === 'fr' ? 'Budget' : 'Budget'}</label>
              <select 
                value={form.budgetPreference} 
                onChange={(e) => setForm({ ...form, budgetPreference: e.target.value })}
              >
                <option value="low">{form.language === 'fr' ? 'Faible' : 'Low'}</option>
                <option value="moderate">{form.language === 'fr' ? 'Modéré' : 'Moderate'}</option>
                <option value="flexible">{form.language === 'fr' ? 'Flexible' : 'Flexible'}</option>
              </select>
            </div>

            <div className={styles.formGroup}>
              <label>{form.language === 'fr' ? 'Niveau d\'activité' : 'Activity Level'}</label>
              <select 
                value={form.activityLevel} 
                onChange={(e) => setForm({ ...form, activityLevel: e.target.value })}
              >
                <option value="low">{form.language === 'fr' ? 'Faible (Sédentaire)' : 'Low (Sedentary)'}</option>
                <option value="moderate">{form.language === 'fr' ? 'Modéré' : 'Moderate'}</option>
                <option value="active">{form.language === 'fr' ? 'Actif' : 'Active'}</option>
              </select>
            </div>

            <div className={styles.formGroup}>
              <label>{form.language === 'fr' ? 'Préférence d\'eau' : 'Water Preference'}</label>
              <select 
                value={form.waterPreference} 
                onChange={(e) => {
                  const nextPref = e.target.value;
                  const prevPref = form.waterPreference;
                  let nextGoal = form.waterGoal;
                  
                  if (form.waterGoal) {
                    const prevCapacity = (prevPref === 'bottle' || prevPref === 'both') ? 750 : 500;
                    const nextCapacity = (nextPref === 'bottle' || nextPref === 'both') ? 750 : 500;
                    if (prevCapacity !== nextCapacity) {
                      nextGoal = Math.round((Number(form.waterGoal) * prevCapacity) / nextCapacity);
                    }
                  }
                  
                  setForm({ ...form, waterPreference: nextPref, waterGoal: nextGoal });
                }}
              >
                <option value="sachet">{form.language === 'fr' ? 'Sachet (Eau pure)' : 'Sachet (Pure Water)'}</option>
                <option value="bottle">{form.language === 'fr' ? 'Bouteille' : 'Bottle'}</option>
                <option value="both">{form.language === 'fr' ? 'Les deux' : 'Both'}</option>
              </select>
            </div>
          </div>

          <div className={styles.editSection}>
            <h3 className={styles.editSectionTitle}>{form.language === 'fr' ? 'Allergies alimentaires' : 'Food Allergies'}</h3>
            
            <div className={styles.formGroup}>
              <div className={styles.allergyGrid}>
                {[
                  { value: 'groundnuts', label: `${form.language === 'fr' ? 'Arachides' : 'Groundnuts'} 🥜` },
                  { value: 'crayfish', label: `${form.language === 'fr' ? 'Écrevisses' : 'Crayfish'} 🦐` },
                  { value: 'milk', label: `${form.language === 'fr' ? 'Lait' : 'Milk'} 🥛` },
                  { value: 'wheat', label: `${form.language === 'fr' ? 'Blé' : 'Wheat'} 🌾` },
                  { value: 'fish', label: `${form.language === 'fr' ? 'Poisson' : 'Fish'} 🐟` },
                  { value: 'eggs', label: `${form.language === 'fr' ? 'Œufs' : 'Eggs'} 🥚` },
                  { value: 'none', label: form.language === 'fr' ? 'Pas d\'allergies' : 'No Allergies' }
                ].map((opt) => {
                  const active = form.allergies?.includes(opt.value);
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      className={`${styles.allergyCard} ${active ? styles.allergyCardActive : ''}`}
                      onClick={() => {
                        let updated = [...(form.allergies || [])];
                        if (opt.value === 'none') {
                          updated = active ? [] : ['none'];
                        } else {
                          updated = updated.filter(a => a !== 'none');
                          if (active) {
                            updated = updated.filter(a => a !== opt.value);
                          } else {
                            updated.push(opt.value);
                          }
                        }
                        setForm({ ...form, allergies: updated });
                      }}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className={styles.formGroup} style={{ marginTop: '12px' }}>
              <label>{form.language === 'fr' ? 'Autres allergies' : 'Other Allergies'}</label>
              <input 
                type="text" 
                value={form.otherAllergies} 
                onChange={(e) => setForm({ ...form, otherAllergies: e.target.value })} 
                placeholder="e.g. Soy, Shellfish"
              />
            </div>
          </div>

          <div className={styles.editSection}>
            <h3 className={styles.editSectionTitle}>{form.language === 'fr' ? 'Objectifs quotidiens personnalisés' : 'Custom Daily Targets'}</h3>
            
            <div className={styles.formGroup}>
              <label>{form.language === 'fr' ? 'Objectif de Calories (kcal)' : 'Calories Target (kcal)'}</label>
              <input 
                type="number" 
                value={form.calorieGoal} 
                onChange={(e) => setForm({ ...form, calorieGoal: e.target.value })} 
              />
            </div>

            <div className={styles.formGroup}>
              <label>
                {form.language === 'fr' ? 'Objectif d\'eau (unités/jour)' : 'Water Target (units/day)'}
              </label>
              <input 
                type="number" 
                value={form.waterGoal} 
                onChange={(e) => setForm({ ...form, waterGoal: e.target.value })} 
              />
            </div>

            <div className={styles.formGroup}>
              <label>{form.language === 'fr' ? 'Objectif de pas' : 'Steps Target'}</label>
              <input 
                type="number" 
                value={form.stepGoal} 
                onChange={(e) => setForm({ ...form, stepGoal: e.target.value })} 
              />
            </div>
          </div>

          <div className={styles.editActions}>
            <button 
              type="submit" 
              className={styles.buttonPrimary} 
              disabled={saving}
            >
              {saving ? (form.language === 'fr' ? 'Enregistrement...' : 'Saving...') : (form.language === 'fr' ? 'Enregistrer' : 'Save Changes')}
            </button>
            <button 
              type="button" 
              className={styles.buttonSecondary} 
              onClick={() => setEditing(false)}
              disabled={saving}
            >
              {form.language === 'fr' ? 'Annuler' : 'Cancel'}
            </button>
          </div>
        </form>
      </div>
    )
  }

  return (
    <div className={`fade-in ${styles.container}`}>
      <header className={styles.header}>
        <div className={styles.avatar}>{displayUser.name.charAt(0)}</div>
        <h1 className={styles.name}>{displayUser.name}</h1>
      </header>

      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <span className={styles.statValue}>
            {displayUser.weight}{' '}
            <span style={{ fontSize: '12px', fontWeight: 'normal' }}>
              {displayUser.unitPreference === 'imperial' ? 'lbs' : 'kg'}
            </span>
          </span>
          <span className={styles.statLabel}>{currentCulture === 'fr' ? 'Poids' : 'Weight'}</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statValue}>{formatHeight(displayUser.height)}</span>
          <span className={styles.statLabel}>{currentCulture === 'fr' ? 'Taille' : 'Height'}</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statValue}>{displayUser.age || '-'}</span>
          <span className={styles.statLabel}>{currentCulture === 'fr' ? 'Âge' : 'Age'}</span>
        </div>
      </div>

      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>{currentCulture === 'fr' ? 'Objectifs quotidiens' : 'Daily targets'}</h3>
        <div className={styles.detailsList}>
          <div className={styles.detailItem}>
            <span className={styles.detailLabel}>{currentCulture === 'fr' ? 'Calories' : 'Calories'}</span>
            <span className={styles.detailValue}>{displayUser.calorieGoal || '—'} kcal</span>
          </div>
          <div className={styles.detailItem}>
            <span className={styles.detailLabel}>{currentCulture === 'fr' ? 'Eau' : 'Water'}</span>
            <span className={styles.detailValue}>
              {displayUser.waterGoal || '—'} {displayUser.waterPreference === 'bottle' ? (currentCulture === 'fr' ? 'bouteilles' : 'bottles') : (currentCulture === 'fr' ? 'sachets' : 'sachets')}/day
            </span>
          </div>
          <div className={styles.detailItem}>
            <span className={styles.detailLabel}>{currentCulture === 'fr' ? 'Pas' : 'Steps'}</span>
            <span className={styles.detailValue}>{displayUser.stepGoal?.toLocaleString() || '—'}</span>
          </div>
        </div>
      </div>

      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>{currentCulture === 'fr' ? 'Objectifs & Préférences' : 'Goals & Preferences'}</h3>
        <div className={styles.detailsList}>
          <div className={styles.detailItem}>
            <span className={styles.detailLabel}>{currentCulture === 'fr' ? 'Objectif' : 'Goal'}</span>
            <span className={styles.detailValue}>
              {displayUser.goal === 'lose' ? (currentCulture === 'fr' ? 'Perdre du poids' : 'lose weight') : 
               displayUser.goal === 'gain' ? (currentCulture === 'fr' ? 'Prendre du poids' : 'gain weight') : 
               (currentCulture === 'fr' ? 'Maintenir' : 'maintain')}
            </span>
          </div>
          {(displayUser.goal === 'lose' || displayUser.goal === 'gain') && displayUser.targetWeight && (
            <div className={styles.detailItem}>
              <span className={styles.detailLabel}>{currentCulture === 'fr' ? 'Poids cible' : 'Target Weight'}</span>
              <span className={styles.detailValue}>
                {displayUser.targetWeight}{' '}
                {displayUser.unitPreference === 'imperial' ? 'lbs' : 'kg'}
              </span>
            </div>
          )}
          <div className={styles.detailItem}>
            <span className={styles.detailLabel}>{currentCulture === 'fr' ? 'Durée' : 'Timeline'}</span>
            <span className={styles.detailValue}>{displayUser.targetDuration}</span>
          </div>
          <div className={styles.detailItem}>
            <span className={styles.detailLabel}>{currentCulture === 'fr' ? 'Mode de vie' : 'Lifestyle'}</span>
            <span className={styles.detailValue}>{displayUser.lifestyleType}</span>
          </div>
          <div className={styles.detailItem}>
            <span className={styles.detailLabel}>{currentCulture === 'fr' ? 'Activité' : 'Activity'}</span>
            <span className={styles.detailValue}>{displayUser.activityLevel}</span>
          </div>
          <div className={styles.detailItem}>
            <span className={styles.detailLabel}>{currentCulture === 'fr' ? 'Pays' : 'Country'}</span>
            <span className={styles.detailValue}>{displayUser.country}</span>
          </div>
          <div className={styles.detailItem}>
            <span className={styles.detailLabel}>{currentCulture === 'fr' ? 'Tribu' : 'Tribe'}</span>
            <span className={styles.detailValue}>{displayUser.tribe}</span>
          </div>
          {allergyList.length > 0 && (
            <div className={styles.detailItem}>
              <span className={styles.detailLabel}>{currentCulture === 'fr' ? 'Allergies' : 'Allergies'}</span>
              <span className={styles.detailValue}>{allergyList.map(a => currentCulture === 'fr' ? (a === 'groundnuts' ? 'arachides' : a === 'crayfish' ? 'écrevisses' : a === 'milk' ? 'lait' : a === 'wheat' ? 'blé' : a === 'fish' ? 'poisson' : a === 'eggs' ? 'œufs' : a) : a).join(', ')}</span>
            </div>
          )}
        </div>
      </div>

      <div className={styles.actions}>
        <button type="button" className={styles.buttonPrimary} onClick={openEdit}>{currentCulture === 'fr' ? 'Modifier le profil' : 'Edit Profile'}</button>
        <button type="button" className={styles.buttonDanger} onClick={handleLogout}>{currentCulture === 'fr' ? 'Se déconnecter' : 'Log Out'}</button>
      </div>
    </div>
  )
}
