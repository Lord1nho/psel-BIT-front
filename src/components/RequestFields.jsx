import { TITLE_MAX, DESCRIPTION_MAX } from '../utils/requestValidation'

// Campos de uma solicitação (assunto, categoria e descrição) com limite, contador e mensagem de erro.
// Usado na criação e na edição. `errors` já vem filtrado pelo que o usuário visitou.
export default function RequestFields({ idPrefix, values, categories, errors, onChange, onBlur }) {
  const near = (len, max) => (len >= max * 0.9 ? 'counter warn' : 'counter')
  return (
    <>
      <div className="field">
        <label htmlFor={`${idPrefix}-title`}>Assunto *</label>
        <input
          id={`${idPrefix}-title`}
          required
          maxLength={TITLE_MAX}
          placeholder="Resuma o problema em uma frase"
          value={values.title}
          onChange={(e) => onChange('title', e.target.value)}
          onBlur={() => onBlur('title')}
          aria-invalid={!!errors.title}
          aria-describedby={`${idPrefix}-title-msg`}
          className={errors.title ? 'invalid' : ''}
        />
        <div className="field-foot" id={`${idPrefix}-title-msg`}>
          <span className="field-error">{errors.title}</span>
          <span className={near(values.title.length, TITLE_MAX)}>{values.title.length}/{TITLE_MAX}</span>
        </div>
      </div>

      <div className="field">
        <label htmlFor={`${idPrefix}-category`}>Categoria *</label>
        <select
          id={`${idPrefix}-category`}
          required
          value={values.categoryId}
          onChange={(e) => onChange('categoryId', e.target.value)}
          onBlur={() => onBlur('categoryId')}
          aria-invalid={!!errors.categoryId}
          className={errors.categoryId ? 'invalid' : ''}
        >
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.nome}</option>
          ))}
        </select>
        {errors.categoryId && <span className="field-error">{errors.categoryId}</span>}
      </div>

      <div className="field">
        <label htmlFor={`${idPrefix}-description`}>Descrição *</label>
        <textarea
          id={`${idPrefix}-description`}
          required
          rows={6}
          maxLength={DESCRIPTION_MAX}
          placeholder="Inclua detalhes, passos para reproduzir e impacto no trabalho"
          value={values.description}
          onChange={(e) => onChange('description', e.target.value)}
          onBlur={() => onBlur('description')}
          aria-invalid={!!errors.description}
          aria-describedby={`${idPrefix}-description-msg`}
          className={errors.description ? 'invalid' : ''}
        />
        <div className="field-foot" id={`${idPrefix}-description-msg`}>
          <span className="field-error">{errors.description}</span>
          <span className={near(values.description.length, DESCRIPTION_MAX)}>{values.description.length}/{DESCRIPTION_MAX}</span>
        </div>
      </div>
    </>
  )
}
