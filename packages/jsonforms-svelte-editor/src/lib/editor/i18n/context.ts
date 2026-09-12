import { getContext, setContext } from "svelte";
export type EditorMessages = Record<string, Record<string, string>>;
const bg: Record<string, string> = {
  "Add property": "Добавяне на свойство",
  "Add definition": "Добавяне на дефиниция",
  Add: "Добавяне",
  Rename: "Преименуване",
  Delete: "Изтриване",
  Name: "Име",
  Save: "Запазване",
  "Schema type or definition": "Тип или дефиниция",
  "Array item type": "Тип на елементите в масива",
  "Delete this schema and its sample data? Referenced schemas cannot be deleted.":
    "Да се изтрие ли схемата и примерните ѝ данни? Използваните схеми не могат да се изтриват.",
  "Edit the schema structure. Arrays start with object items; expand items to add their properties.":
    "Редактирайте структурата на схемата. Разгънете елементите на масива, за да добавите свойства.",
  "Enter a name.": "Въведете име.",
  "That name already exists.": "Това име вече съществува.",
  "Choose a different name.": "Изберете друго име.",
  "Select an object schema.": "Изберете обектна схема.",
  "Choose an existing definition.": "Изберете съществуваща дефиниция.",
  "Choose a schema type.": "Изберете тип на схемата.",
  "This schema is still referenced. Remove its controls, rules or references first.":
    "Схемата все още се използва. Първо премахнете свързаните контроли, правила или препратки.",
  "Sample data already contains the new name.":
    "Примерните данни вече съдържат новото име.",
  "Use JSON Model to edit schemas with embedded resource identifiers.":
    "Използвайте JSON модела за схеми с вложени идентификатори на ресурси.",

  "JSON Model": "JSON модел",
  Design: "Дизайн",
  Validate: "Проверка",
  Apply: "Прилагане",
  Revert: "Отмяна",
  Source: "Изходен код",
  Document: "Документ",
  "Source document": "Изходен документ",
  "Model source": "JSON източник",
  "Loading Monaco…": "Зареждане на Monaco…",
  "Form editor": "Редактор на формуляри",
  "Editor views": "Изгледи на редактора",
  "Schema tree": "Дърво на схемата",
  "Show unused fields only": "Само неизползвани полета",
  "Drag to add. Click to select a field or its existing control.":
    "Плъзнете за добавяне. Щракнете за избор на поле или съществуващ контрол.",
  "All fields are already placed.": "Всички полета вече са поставени.",
  "Schema field": "Поле от схемата",
  "Control placement": "Място на контрола",
  "This field is not placed in the form. Drag it to a layout to create a control. Edit its schema in JSON Model.":
    "Полето не е поставено във формуляра. Плъзнете го в оформление за създаване на контрол. Редактирайте схемата в JSON модел.",
  "This field has multiple controls. Choose which placement to edit. Schema properties are shared; UI options belong to the selected placement.":
    "Полето има няколко контрола. Изберете кой да редактирате. Свойствата на схемата са общи; UI опциите са за избраното място.",
  "Apply input": "Прилагане на входните данни",
  "Revert input": "Отмяна на входните данни",
  Choices: "Възможности за избор",
  "Choice schema": "Схема на избора",
  "Selection display": "Изглед на избора",
  "Height (px)": "Височина (px)",
  "Image URL": "Адрес на изображението",
  "Alternative text": "Алтернативен текст",
  "Checkbox group": "Група отметки",
  "Radio group": "Радио група",
  Select: "Падащ списък",
  Separator: "Разделител",
  Spacer: "Разстояние",
  "Image View": "Изображение",
  "Form languages": "Езици на формуляра",
  "Add form language": "Добавяне на език за формуляра",
  "Language code": "Код на езика",
  "Add language": "Добавяне на език",
  None: "Няма",
  "Enter a valid language code.": "Въведете валиден код на език.",
  "This language already exists.": "Този език вече съществува.",
  "Enter a language code, for example en, bg or fr-CA. Existing translations are preserved.":
    "Въведете код на език, например en, bg или fr-CA. Съществуващите преводи се запазват.",
  Show: "Показване",
  Hide: "Скриване",
  "Select a type": "Изберете тип",
  Types: "Типове",
  "Additional types": "Допълнителни типове",
  "Rule has unapplied changes. Apply or revert to resume visual editing.": "Правилото има неприложени промени. Приложете или отменете промените.",
  Rules: "Правила",
  Rule: "Правило",
  "Add rule": "Добавяне на правило",
  "Edit rule": "Редактиране на правило",
  "Remove rule": "Премахване на правило",
  "Apply rule": "Прилагане на правило",
  "Revert rule": "Отмяна на промените в правилото",
  Effect: "Действие",
  "Field/context": "Поле/контекст",
  "Entire form": "Целият формуляр",
  Condition: "Условие",
  "Value type": "Тип на стойността",
  Value: "Стойност",
  "Do not match when the field is missing": "Не изпълнявай условието при липсващо поле",
  "Preview condition": "Условие в прегледа",
  Matches: "Изпълнено",
  "Does not match": "Неизпълнено",
  "Cannot evaluate": "Не може да се оцени",
  "This condition is edited as JSON to preserve its full meaning.": "Това условие се редактира като JSON, за да се запази значението му.",
  Properties: "Свойства",
  properties: "свойства",
  "Move up": "Нагоре",
  "Move down": "Надолу",
  "Remove element": "Премахване на елемент",
  "Changes update the form model.": "Промените обновяват модела на формуляра.",
  General: "Общи",
  Schema: "Схема",
  Appearance: "Изглед",
  Validation: "Валидация",
  Layout: "Подредба",
  Translations: "Преводи",
  Label: "Етикет",
  Text: "Текст",
  Action: "Действие",
  Title: "Заглавие",
  Description: "Описание",
  "Read only": "Само за четене",
  Multiline: "Многоредово",
  Required: "Задължително",
  Collapsible: "Свиваемо",
  "Initially collapsed": "Първоначално свито",
  "Show data indicator": "Показване на индикатор за данни",
  "Translation key": "Ключ за превод",
  "Translation locale": "Език на превода",
  "Translated label/text": "Преведен етикет/текст",
  "Translated description": "Преведено описание",
  "Minimum length": "Минимална дължина",
  "Maximum length": "Максимална дължина",
  Pattern: "Шаблон",
  Format: "Формат",
  Minimum: "Минимум",
  Maximum: "Максимум",
  "Multiple of": "Кратно на",
  "Form Definition": "Дефиниция на формуляра",
  "Form language": "Език на формуляра",
  "Form Preview": "Преглед на формуляра",
  "Form Input": "Входни данни",
  "Form Output": "Изходни данни",
  Components: "Компоненти",
  Inputs: "Входни полета",
  Selection: "Избор",
  Presentation: "Представяне",
  Actions: "Действия",
  Containers: "Контейнери",
  "Source has unapplied changes. Apply or revert to resume visual editing.":
    "Има неприложени промени. Приложете или отменете, за да продължите визуалното редактиране.",
};
const key = Symbol("editor-i18n");
export function provideEditorI18n(
  locale: () => string,
  messages: () => EditorMessages,
  formLocale: () => string,
  setFormLocale: (locale: string) => void = () => {},
) {
  const value = {
    setFormLocale,
    get locale() {
      return locale();
    },
    get formLocale() {
      return formLocale();
    },
    t(message: string) {
      const language = locale().split("-")[0];
      return (
        messages()[locale()]?.[message] ??
        messages()[language]?.[message] ??
        (language === "bg" ? bg[message] : undefined) ??
        message
      );
    },
  };
  setContext(key, value);
  return value;
}
export const useEditorI18n = () =>
  getContext<ReturnType<typeof provideEditorI18n>>(key) ?? {
    locale: "en",
    formLocale: "en",
    setFormLocale: (_locale: string) => {},
    t: (value: string) => value,
  };
