package com.agrisense.service;

import com.agrisense.dto.FieldDto;
import com.agrisense.entity.Farm;
import com.agrisense.entity.Field;
import com.agrisense.entity.Role;
import com.agrisense.entity.User;
import com.agrisense.exception.ConflictException;
import com.agrisense.exception.ResourceNotFoundException;
import com.agrisense.repository.CropRepository;
import com.agrisense.repository.FarmRepository;
import com.agrisense.repository.FieldRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Objects;

@Service
@RequiredArgsConstructor
public class FieldService {

    private final FieldRepository fieldRepository;
    private final FarmRepository farmRepository;
    private final CropRepository cropRepository;
    private final CurrentUserService currentUserService;

    @Transactional(readOnly = true)
    public List<FieldDto> findAll(Long farmId) {
        User user = currentUserService.getCurrentUser();

        List<Field> fields;

        if (farmId != null) {
            getAccessibleFarm(farmId, user);
            fields = fieldRepository.findByFarmId(farmId);
        } else if (user.getRole() == Role.FARMER) {
            fields = fieldRepository.findByFarmUserId(user.getId());
        } else if (user.getRole() == Role.ANALYST
                || user.getRole() == Role.ADMIN) {
            fields = fieldRepository.findAll();
        } else {
            throw new AccessDeniedException("You cannot view fields");
        }

        return fields.stream()
                .map(this::toDto)
                .toList();
    }

    @Transactional(readOnly = true)
    public FieldDto findById(Long fieldId) {
        return toDto(getAccessibleField(fieldId));
    }

    @Transactional
    public FieldDto create(FieldDto dto) {
        User user = currentUserService.getCurrentUser();
        ensureFieldManagementAllowed(user);

        Farm farm = getManagedFarm(dto.getFarmId(), user);

        double areaAcres = AreaConverter.toCanonicalAcres(
                dto.getAreaAcres(),
                dto.getAreaValue(),
                dto.getAreaUnit()
        );

        validateAvailableFarmArea(farm, areaAcres, null);

        Field field = new Field();
        field.setName(dto.getName());
        field.setFarm(farm);
        field.setAreaAcres(areaAcres);

        return toDto(fieldRepository.save(field));
    }

    @Transactional
    public FieldDto update(Long fieldId, FieldDto dto) {
        User user = currentUserService.getCurrentUser();
        ensureFieldManagementAllowed(user);

        Field field = getOwnedField(fieldId);

        Farm farm = dto.getFarmId() == null
                ? field.getFarm()
                : getManagedFarm(dto.getFarmId(), user);

        double areaAcres = AreaConverter.toCanonicalAcres(
                dto.getAreaAcres(),
                dto.getAreaValue(),
                dto.getAreaUnit()
        );

        validateAvailableFarmArea(farm, areaAcres, fieldId);

        field.setName(dto.getName());
        field.setFarm(farm);
        field.setAreaAcres(areaAcres);

        return toDto(fieldRepository.save(field));
    }

    @Transactional
    public void delete(Long fieldId) {
        deleteField(fieldId);
    }

    @Transactional(readOnly = true)
    public Field getOwnedField(Long fieldId) {
        Field field = fieldRepository.findById(fieldId)
                .orElseThrow(() ->
                        new ResourceNotFoundException("Plot not found"));

        User user = currentUserService.getCurrentUser();

        if (user.getRole() == Role.ADMIN) {
            return field;
        }

        if (user.getRole() != Role.FARMER
                || !Objects.equals(
                        field.getFarm().getUser().getId(),
                        user.getId())) {
            throw new ResourceNotFoundException("Plot not found");
        }

        return field;
    }

    @Transactional(readOnly = true)
    public Field getAccessibleField(Long fieldId) {
        User user = currentUserService.getCurrentUser();

        if (user.getRole() == Role.ANALYST
                || user.getRole() == Role.ADMIN) {
            return fieldRepository.findById(fieldId)
                    .orElseThrow(() ->
                            new ResourceNotFoundException("Plot not found"));
        }

        return getOwnedField(fieldId);
    }

    // Backward-compatible entity access methods.
    @Transactional(readOnly = true)
    public List<Field> getAllFields() {
        User user = currentUserService.getCurrentUser();

        if (user.getRole() == Role.FARMER) {
            return fieldRepository.findByFarmUserId(user.getId());
        }

        if (user.getRole() == Role.ANALYST
                || user.getRole() == Role.ADMIN) {
            return fieldRepository.findAll();
        }

        throw new AccessDeniedException("You cannot view fields");
    }

    @Transactional(readOnly = true)
    public Field getFieldById(Long fieldId) {
        return getAccessibleField(fieldId);
    }

    @Transactional(readOnly = true)
    public List<Field> getFieldsByFarm(Long farmId) {
        User user = currentUserService.getCurrentUser();
        getAccessibleFarm(farmId, user);
        return fieldRepository.findByFarmId(farmId);
    }

    @Transactional
    public void deleteField(Long fieldId) {
        User user = currentUserService.getCurrentUser();
        ensureFieldManagementAllowed(user);

        Field field = getOwnedField(fieldId);

        if (!cropRepository.findByFieldId(fieldId).isEmpty()) {
            throw new ConflictException(
                    "Cannot delete a plot while crops are associated with it."
            );
        }

        fieldRepository.delete(field);
    }

    private Farm getAccessibleFarm(Long farmId, User user) {
        Farm farm = farmRepository.findById(farmId)
                .orElseThrow(() ->
                        new ResourceNotFoundException("Farm not found"));

        if (user.getRole() == Role.FARMER
                && !Objects.equals(farm.getUser().getId(), user.getId())) {
            throw new ResourceNotFoundException("Farm not found");
        }

        if (user.getRole() != Role.FARMER
                && user.getRole() != Role.ANALYST
                && user.getRole() != Role.ADMIN) {
            throw new AccessDeniedException("You cannot access this farm");
        }

        return farm;
    }

    private Farm getManagedFarm(Long farmId, User user) {
        if (farmId == null) {
            throw new ResourceNotFoundException("Farm not found");
        }

        if (user.getRole() == Role.FARMER) {
            return getAccessibleFarm(farmId, user);
        }

        if (user.getRole() == Role.ADMIN) {
            return farmRepository.findById(farmId)
                    .orElseThrow(() ->
                            new ResourceNotFoundException("Farm not found"));
        }

        throw new AccessDeniedException(
                "You are not allowed to manage fields"
        );
    }

    private void ensureFieldManagementAllowed(User user) {
        if (user.getRole() != Role.FARMER
                && user.getRole() != Role.ADMIN) {
            throw new AccessDeniedException(
                    "You are not allowed to manage fields"
            );
        }
    }

    private void validateAvailableFarmArea(
            Farm farm,
            double requestedAreaAcres,
            Long fieldIdToExclude) {

        double allocatedArea = fieldRepository.findByFarmId(farm.getId())
                .stream()
                .filter(existing -> fieldIdToExclude == null
                        || !existing.getId().equals(fieldIdToExclude))
                .mapToDouble(Field::getAreaAcres)
                .sum();

        if (allocatedArea + requestedAreaAcres
                > farm.getAreaAcres() + 0.000001) {
            throw new ConflictException(
                    "Total plot area cannot exceed the farm's available area."
            );
        }
    }

    private FieldDto toDto(Field field) {
        FieldDto dto = new FieldDto();

        dto.setId(field.getId());
        dto.setName(field.getName());
        dto.setFarmId(field.getFarm().getId());
        dto.setAreaAcres(field.getAreaAcres());
        dto.setAreaHectares(
                AreaConverter.toHectares(field.getAreaAcres())
        );

        return dto;
    }
}
