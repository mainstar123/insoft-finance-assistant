import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { api, ApiError } from '@/lib/api';

interface AuthFormProps {
	mode: 'signin' | 'signup';
	onSuccess: (data: any) => void;
	onError: (error: Error) => void;
}

export function AuthForm({ mode, onSuccess, onError }: AuthFormProps) {
	const [isLoading, setIsLoading] = useState(false);
	const [formData, setFormData] = useState({
		email: '',
		password: '',
		firstName: '',
		lastName: '',
	});

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setIsLoading(true);

		try {
			const data = mode === 'signup'
				? await api.signUp(formData)
				: await api.signIn({
					email: formData.email,
					password: formData.password
				});
			onSuccess(data);
		} catch (error) {
			onError(error instanceof ApiError ? error : new Error('Authentication failed'));
		} finally {
			setIsLoading(false);
		}
	};

	const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setFormData(prev => ({
			...prev,
			[e.target.name]: e.target.value
		}));
	};

	return (
		<form onSubmit={handleSubmit} className="space-y-4 w-full">
			<div className="space-y-2">
				<input
					type="email"
					name="email"
					placeholder="Email"
					value={formData.email}
					onChange={handleChange}
					required
					className="w-full p-2 rounded border border-gray-700 bg-transparent text-white"
				/>
			</div>

			<div className="space-y-2">
				<input
					type="password"
					name="password"
					placeholder="Password"
					value={formData.password}
					onChange={handleChange}
					required
					className="w-full p-2 rounded border border-gray-700 bg-transparent text-white"
				/>
			</div>

			{mode === 'signup' && (
				<>
					<div className="space-y-2">
						<input
							type="text"
							name="firstName"
							placeholder="First Name"
							value={formData.firstName}
							onChange={handleChange}
							className="w-full p-2 rounded border border-gray-700 bg-transparent text-white"
						/>
					</div>

					<div className="space-y-2">
						<input
							type="text"
							name="lastName"
							placeholder="Last Name"
							value={formData.lastName}
							onChange={handleChange}
							className="w-full p-2 rounded border border-gray-700 bg-transparent text-white"
						/>
					</div>
				</>
			)}

			<Button
				type="submit"
				className="w-full bg-middle text-white"
				disabled={isLoading}
			>
				{isLoading ? 'Loading...' : mode === 'signup' ? 'Sign Up' : 'Sign In'}
			</Button>
		</form>
	);
}
