<script>
	let { value = $bindable(''), id, label, placeholder = '', error = '', autocomplete = 'current-password' } = $props();
	let ver = $state(false);
</script>

<label class="form-label fw-semibold" for={id}>{label}</label>
<div class="input-group has-validation">
	<span class="input-group-text"><i class="bi bi-lock-fill"></i></span>
	<input {id} class="form-control" class:is-invalid={error} type={ver ? 'text' : 'password'} bind:value {placeholder} {autocomplete} />
	<button type="button" class="btn btn-outline-secondary" onclick={() => (ver = !ver)} aria-label="Mostrar u ocultar contraseña">
		<i class="bi {ver ? 'bi-eye-slash' : 'bi-eye'}"></i>
	</button>
	{#if error}<div class="invalid-feedback">{error}</div>{/if}
</div>
