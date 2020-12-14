<script>
	let email, url, title, data_id;

	let success = false; 
	let error = false;

	let notifications = 10;
	let period = 1;
	let int_or_float = false;
	let id_or_class = false;
	let symbols = false;
	let index_start = 0;
	let index_end = 0;


	const onSubmit = async() => {
		const response = await fetch('http://localhost:8000', {
			method: 'POST',
			headers: {
				'Accept': 'application/json',
      			'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				title: title,
				email: email,
				period: period,
				url: url,
				notif_time: notifications,
				data_id: data_id,
				id_or_class: id_or_class,
				int_or_float: int_or_float,
				symbols: symbols,
				index_start: index_start,
				index_end: index_end
			})
		}).then(res => {
			error = false;
			success = true;
			console.log(res);
		})
		.catch(err => {
			success = false;
			error = true;
			console.log(res);
		})
	}

	const emptyForm = () => {
		document.getElementById('title').value = ''
		document.getElementById('email').value = ''
		document.getElementById('url').value = ''
		document.getElementById('notif_time').value = ''
		document.getElementById('data_id').value = ''
		document.getElementById('id_or_class').checked = false
		document.getElementById('int_or_float').checked = false
		document.getElementById('symbols').checked = false
		document.getElementById('index_start').value = 0
		document.getElementById('index_end').value = 0

		title = undefined
		email= undefined
		period= 1
		url= undefined
		notif_time = 10						
		data_id = undefined
		id_or_class = false
		int_or_float= false
		symbols= false
		index_start = 0
		index_end = 0
		notifications = 10;
		period = 1;
	}
</script>

<main class="container p-5">
	<h1 class="text-center">Web analyzer</h1>
	<div class="container shadow p-7 rounded">
		{#if success}
		   <div class="p-5">
				<div class="alert alert-success"  role="alert">Thanks for your submission, you will be informed in your email you given</div>
		   </div>
		{:else if error}
			<div class="p-5">
				<div class="alert alert-danger"  role="alert">Invalid data given</div>
			</div>
		{/if}
		<form on:submit|preventDefault={onSubmit} class="container p-5">
			<div class="w-75 mb-3">
				<label for="email" class="form-label">Email:</label>
				<input type="email" class="form-control" id="email" on:input={e => email = e.target.value}/>
			</div>
			<div class="w-75 mb-3">
				<label for="title" class="form-label">Title:</label>
				<input type="text" class="form-control" id="title" on:input={e => title = e.target.value}/>
			</div>
			<div class="w-75 mb-3">
				<label for="url" class="form-label">URL:</label>
				<input type="text" class="form-control" id="url" on:input={e => url = e.target.value}/>
			</div>
			<div class="form-check">
				<label for="id" class="form-check-label">Id or class(Check if id)</label>
				<input type="checkbox" class="form-check-input" id="id" bind:checked={id_or_class}/>
			</div>
			<div class="w-75 mb-3">
				<label for="data_id" class="form-label">Data id or class:</label>
				<input type="text" class="form-control" id="data_id" on:input={e => data_id = e.target.value}/>
			</div>
			<div class="form-check">
				<label for="symbols" class="form-check-label">Symbols</label>
				<input type="checkbox" class="form-check-input" id="symbols" bind:checked={symbols}/>
			</div>
			<div class="w-75 mb-3">
				<label for="instart" class="form-label">Index Start:</label>
				<input type="number" class="form-control w-25 d-inline" id="instart" on:input={e => index_start = e.target.value} disabled={!symbols}/>
			</div>
			<div class="w-75 mb-3">
				<label for="inend" class="form-label">Index End:</label>
				<input type="number" class="form-control w-25 d-inline" id="inend" on:input={e => index_end = e.target.value} disabled={!symbols}/>
			</div>
			<div class="form-check">
				<label for="intfloat" class="form-check-label">Integer or Floar(Check if integer)</label>
				<input type="checkbox" class="form-check-input" id="intfloat" bind:checked={int_or_float}/>
			</div>
			<div class="w-75 mb-3">
				<label for="notifications" class="form-label">Inform me every...</label>
				<select id="notifications" class="form-select" on:input={e => notifications = e.target.value}>
					<option value="10">10 minutes</option>
					<option value="30">30 minutes</option>
					<option value="60">1 hour</option>
					<option value="120">2 hours</option>
					<option value="300">5 hours</option>
					<option value="1440">1 day</option>
					<option value="4320">3 days</option>
					<option value="10080">7 days</option>
					<option value="20160">14 days</option>
				</select>
			</div>
			<div class="w-75 mb-3">
				<label for="period" class="form-label">Inform me for...</label>
				<select id="period" class="form-select" on:input={e => period = e.target.value}>
					<option value="1">1 day</option>
					<option value="3">3 days</option>
					<option value="7">1 week</option>
					<option value="14">2 weeks</option>
					<option value="30">1 month</option>
					<option value="90">3 months</option>
					<option value="180">6 months</option>
					<option value="365">1 year</option>
				</select>
			</div>
			<button class="btn btn-primary mt-3" on:click={emptyForm}>Submit</button>
		</form>
	</div>
	<div class="container shadow p-7 rounded">
		<h3 class="text-center pt-5">Instructions</h3>
		<div class="container">
			<ol class="p-5">
				<li>Input your email</li>
				<li>Input a title of your choice</li>
				<li>Input the url of the target's page</li>
				<li>Check the checkbox to select the target by id else it will be selcted by its class name</li>
				<li>Input the id or class name</li>
				<li>Check the checkbox if the target contains characters other than number (for example '$', '€'..) and input the 
					index that the target starts and the index that it ends. Note this is 0-indexed</li>
				<li></li>
				<li>Select how often you want to be informed</li>
				<li>Select how long you want to be informed</li>
			</ol>
			<div class="p-3">
				<h5>Note*</h5>
				<p>Some websites may not support webscraping</p>
			</div>
		</div>
	</div>
</main>