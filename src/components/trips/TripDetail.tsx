/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Car, Info, Trash2, Edit, ArrowRight, ArrowLeftRight } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { toast } from 'sonner';

export function TripDetail({ trip, currentUserId, onMutate }: { trip: any, currentUserId: string, onMutate: () => void }) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const departureDate = new Date(trip.departureTime);
  const arrivalDate = new Date(trip.estimatedArrivalTime);

  const destinationName = trip.destinationCampus?.name || trip.destinationOtherLabel || "Destination inconnue";

  const handleDelete = async () => {
    if (!trip.permissions.canDelete) {
      toast.error("Vous ne pouvez pas supprimer ce trajet avec des passagers. Contactez un admin.");
      return;
    }

    setIsDeleting(true);
    try {
      const res = await fetch(`/api/trips/${trip.id}`, { method: 'DELETE' });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Erreur de suppression");
      }
      toast.success("Trajet supprimé");
      router.push('/trips');
    } catch (error: any) {
      toast.error(error.message);
      setIsDeleting(false);
      setShowDeleteModal(false);
    }
  };

  return (
    <>
      <Card style={{ marginBottom: '24px', padding: '32px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px' }}>
          <div>
            {trip.status === 'CANCELLED' ? (
              <Badge variant="danger" style={{ marginBottom: '8px' }}>Annulé</Badge>
            ) : trip.type === 'ONE_WAY' ? (
              <Badge variant="info" style={{ marginBottom: '8px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                Aller simple <ArrowRight size={14} />
              </Badge>
            ) : (
              <Badge variant="info" style={{ marginBottom: '8px', display: 'inline-flex', alignItems: 'center', gap: '6px', backgroundColor: 'var(--color-primary)', color: 'white' }}>
                Aller-retour <ArrowLeftRight size={14} />
              </Badge>
            )}
            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-primary)' }}>
              {format(departureDate, 'EEEE d MMMM yyyy', { locale: fr })}
            </h2>
          </div>
          <Badge variant="info">
            <Car size={14} style={{ marginRight: '6px' }} />
            {trip.vehicle.name} ({trip.vehicle.licensePlate})
          </Badge>
        </div>

        {/* Timeline (Frise chronologique) */}
        <div style={{ padding: '32px', backgroundColor: 'var(--color-surface-hover)', borderRadius: 'var(--radius-md)', marginBottom: '32px', display: 'flex', flexDirection: 'column', gap: '32px' }}>
          {/* Trajet Aller */}
          <div style={{ display: 'flex', gap: '16px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{ width: '16px', height: '16px', borderRadius: '50%', backgroundColor: 'var(--color-primary)', border: '3px solid white', zIndex: 1 }} />
              <div style={{ width: '2px', height: '60px', backgroundColor: 'var(--color-border)' }} />
              <div style={{ width: '16px', height: '16px', borderRadius: '50%', backgroundColor: trip.type === 'ONE_WAY' ? 'var(--color-success)' : 'var(--color-text-secondary)', border: '3px solid white', zIndex: 1 }} />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', paddingBottom: '4px', flexGrow: 1 }}>
              <div style={{ height: '76px' }}>
                <span style={{ fontWeight: 700, fontSize: '1.1rem', marginRight: '12px' }}>{format(departureDate, 'HH:mm')}</span>
                <span style={{ fontSize: '1.1rem', color: 'var(--color-text)' }}>Départ : {trip.originCampus.name}</span>
              </div>
              <div>
                <span style={{ fontWeight: 700, fontSize: '1.1rem', marginRight: '12px' }}>{format(arrivalDate, 'HH:mm')}</span>
                <span style={{ fontSize: '1.1rem', color: 'var(--color-text)' }}>Arrivée : {destinationName}</span>
              </div>
            </div>
          </div>

          {/* Trajet Retour (si applicable) */}
          {trip.type !== 'ONE_WAY' && trip.returnDepartureTime && trip.estimatedReturnArrivalTime && (
            <div style={{ display: 'flex', gap: '16px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{ width: '16px', height: '16px', borderRadius: '50%', backgroundColor: 'var(--color-text-secondary)', border: '3px solid white', zIndex: 1 }} />
                <div style={{ width: '2px', height: '60px', backgroundColor: 'var(--color-border)', borderLeft: '2px dashed var(--color-border)', marginLeft: '-2px' }} />
                <div style={{ width: '16px', height: '16px', borderRadius: '50%', backgroundColor: 'var(--color-primary)', border: '3px solid white', zIndex: 1 }} />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', paddingBottom: '4px', flexGrow: 1 }}>
                <div style={{ height: '76px' }}>
                  <span style={{ fontWeight: 700, fontSize: '1.1rem', marginRight: '12px' }}>{format(new Date(trip.returnDepartureTime), 'HH:mm')}</span>
                  {format(new Date(trip.returnDepartureTime), 'd MMM yyyy', { locale: fr }) !== format(departureDate, 'd MMM yyyy', { locale: fr }) && (
                    <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--color-primary)', marginRight: '12px' }}>({format(new Date(trip.returnDepartureTime), 'd MMM', { locale: fr })})</span>
                  )}
                  <span style={{ fontSize: '1.1rem', color: 'var(--color-text)' }}>Départ retour : {destinationName}</span>
                </div>
                <div>
                  <span style={{ fontWeight: 700, fontSize: '1.1rem', marginRight: '12px' }}>{format(new Date(trip.estimatedReturnArrivalTime), 'HH:mm')}</span>
                  <span style={{ fontSize: '1.1rem', color: 'var(--color-text)' }}>Arrivée retour : {trip.returnCampus?.name}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Conducteur et Commentaires */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
          <div>
            <h4 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '8px' }}>Conducteur</h4>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: 'var(--color-primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-primary)', fontWeight: 600, fontSize: '1.2rem' }}>
                {trip.driverDisplayName.charAt(0)}
              </div>
              <div>
                <div style={{ fontWeight: 600 }}>{trip.driverDisplayName}</div>
                <div style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>{trip.driverEmail}</div>
              </div>
            </div>
          </div>

          {trip.comment && (
            <div>
              <h4 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Info size={16} /> Commentaire
              </h4>
              <p style={{ fontSize: '0.9rem', backgroundColor: 'var(--color-surface-hover)', padding: '12px', borderRadius: 'var(--radius-sm)' }}>
                {trip.comment}
              </p>
            </div>
          )}
        </div>

        {/* Actions (Conducteur/Admin) */}
        {trip.status !== 'CANCELLED' && (trip.permissions.canDelete || trip.permissions.canModifyDeparture) && (
          <div style={{ marginTop: '32px', paddingTop: '24px', borderTop: '1px solid var(--color-border)', display: 'flex', gap: '16px', justifyContent: 'flex-end' }}>
             {trip.permissions.canModifyDeparture && (
               <Button variant="secondary" disabled>
                 <Edit size={16} style={{ marginRight: '8px' }} /> Modifier l&apos;heure
               </Button>
             )}
             <Button
               variant={trip.permissions.canDelete ? "danger" : "secondary"}
               onClick={() => trip.permissions.canDelete ? setShowDeleteModal(true) : toast.error("Vous devez contacter un admin pour supprimer ce trajet car des passagers se sont inscrits.")}
             >
               <Trash2 size={16} style={{ marginRight: '8px' }} /> Supprimer
             </Button>
          </div>
        )}
      </Card>

      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Confirmer la suppression"
      >
        <p style={{ marginBottom: '24px' }}>Êtes-vous sûr de vouloir annuler ce trajet ? Cette action est irréversible.</p>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>Annuler</Button>
          <Button variant="danger" onClick={handleDelete} isLoading={isDeleting}>Confirmer l&apos;annulation</Button>
        </div>
      </Modal>
    </>
  );
}
