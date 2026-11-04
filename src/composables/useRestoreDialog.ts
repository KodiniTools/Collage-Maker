import { ref } from 'vue'
import { useAutoSave } from '@/composables/useAutoSave'

type AutoSave = ReturnType<typeof useAutoSave>

/**
 * Wiederherstellungsdialog für die automatische Speicherung: beim Start
 * gespeicherten Stand anbieten, wiederherstellen, verwerfen oder ignorieren.
 */
export function useRestoreDialog(autoSave: AutoSave) {
  const showRestoreDialog = ref(false)
  const restoreSaveDate = ref<Date | null>(null)

  /** Prüft, ob gespeicherte Daten vorhanden sind, und öffnet ggf. den Dialog. */
  function checkForSavedState() {
    if (autoSave.hasSavedState()) {
      restoreSaveDate.value = autoSave.getSaveDate()
      showRestoreDialog.value = true
    }
  }

  async function handleRestore() {
    showRestoreDialog.value = false
    await autoSave.restoreState()
  }

  function handleDiscardRestore() {
    showRestoreDialog.value = false
    autoSave.clearSavedState()
  }

  function handleContinueWithoutRestore() {
    showRestoreDialog.value = false
  }

  return {
    showRestoreDialog,
    restoreSaveDate,
    checkForSavedState,
    handleRestore,
    handleDiscardRestore,
    handleContinueWithoutRestore,
  }
}
