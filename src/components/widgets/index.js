import SingleChoiceWidget from './SingleChoiceWidget.jsx'
import MultipleChoiceWidget from './MultipleChoiceWidget.jsx'
import FormelLueckeWidget from './FormelLueckeWidget.jsx'
import FreitextZahlWidget from './FreitextZahlWidget.jsx'
import ReihenfolgeWidget from './ReihenfolgeWidget.jsx'
import ZuordnungWidget from './ZuordnungWidget.jsx'

export const WidgetMap = {
  single_choice: SingleChoiceWidget,
  multiple_choice: MultipleChoiceWidget,
  formel_luecke: FormelLueckeWidget,
  freitext_zahl: FreitextZahlWidget,
  reihenfolge: ReihenfolgeWidget,
  zuordnung: ZuordnungWidget,
}
